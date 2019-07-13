import config from '../config/config'
import twilio from 'twilio'
import { Database } from './database'
import { serviceList } from './shopData'
import { createJob } from './cron'

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()

const introWords = ['Great', 'Thanks', 'Fantastic', "Awesome", 'Amazing', 'Sweet', 'Okay', 'Phenominal'];
const introGreetingWords = ["What's good", "How you doing", "How you been", 'Long time no see']

const randomWord = () => introWords[Math.floor(Math.random() * introWords.length)]
const randomGreeting = () => introGreetingWords[Math.floor(Math.random() * introGreetingWords.length)]

export const getTextMessageTwiml = (res: any) => {
  return (message: string) => {
    const msg = new MessagingResponse()
    msg.message(message)
    res.writeHead(200, { 'Content-Type': 'text/xml' })
    return res.end(msg.toString())
  }
}

export function extractText(body: string): string {
  return String(body.match(/\w+/gi))
}

export async function phoneAppointmentFlow(req, res, next) {
  // Use the Twilio Node.js SDK to build an XML response
  const phoneNumber = phoneNumberFormatter(res.req.body.From)
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/chooseService',
    method: 'POST',
    finishOnKey: '#'
  })

  const customer = await database.findCustomerInDatabase(phoneNumber)

  gather.say(
    'Thank you for calling Barber Sharp!. We would love to service you today. What type of service would you like? Please choose one or more of the following. Press pound to continue. \n(1) for Adult Haircut\n(2) for Child Haircut\n(3) for Haircut and Shave\n(4) Beard Trim\n(5) Dry Shave with Clippers\n(6) Razor Shave\n(7) Hairline or Edge Up\n(8) Mustache Trim.(9) Shampoo',
    { voice: 'Polly.Salli' }
  )

  if (!customer) await database.createCustomer(phoneNumber)

  // Render the response as XML in reply to the webhook request
  res.send(twiml.toString())
}

export async function chooseService(req, res, next) {
  // Use the Twilio Node.js SDK to build an XML response
  const keyPress = res.req.body.Digits
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/chosenBarber',
    method: 'POST',
    numDigits: 1,
    timeout: 7
  })

  if (res.req.query.redirect) {
    gather.say(
      `Which barber would you like today? Press one for Kelly, Press two for Anson, Press 3 for Idris`,
      { voice: 'Polly.Salli' }
    )
    return res.send(twiml.toString())
  }

  if (keyPress[0] === '0') {
    twiml.say(`${randomWord()}! I'm connecting you to the shop right now.`, {
      voice: 'Polly.Salli'
    })
    twiml.dial('9082097544')
    res.set('Content-Type', 'text/xml')
    return res.send(twiml.toString())
  }

  let services = [], total = 0

  keyPress.split('').forEach(n => {
    const service = serviceList[n].service
    const price = serviceList[n].price

    services.push(service)
    total += price
  })

  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { service: services, total }
    )
  } catch (err) {
    next(err)
  }

  gather.say(
    `${randomWord()}! So you would like a ${services} and your current total is $${total}. Which barber would you like today? Press one for Kelly, Press two for Anson, Press 3 for Idris`,
    { voice: 'Polly.Salli' }
  )
  return res.send(twiml.toString())
}

export async function chosenBarber(req, res, next) {
  const keyPress = res.req.body.Digits
  const phoneNumber = phoneNumberFormatter(res.req.body.From)
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/confirmation',
    method: 'POST',
    numDigits: 1
  })
  let barberName

  switch (keyPress) {
    case '1':
      barberName = 'Kelly'
      break
    case '2':
      barberName = 'Anson'
      break
    case '3':
      barberName = 'Idris'
      break
  }

  let availableTimes = [
    '11am - 12pm',
    '12pm - 1pm',
    '1pm - 2pm',
    '2pm - 3pm',
    '3pm - 4pm',
    '4pm - 5pm',
    '5pm - 6pm',
    '6pm - 7pm',
    '7pm - 8pm'
  ]

  await database.updateCustomer(
    phoneNumber,
    { barber: barberName }
  )

  await database.findBarberInDatabase(barberName).then(barber => {
    console.log(barber, 'found barber')
    const schedule = barber.get('appointments').toObject()
    const timesTaken = schedule.map(customer => customer.time);

    // filter out times available from times taken
    timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))
  })

  if (!availableTimes.length) {
    twiml.say(
      `I'm so sorry! ${barberName} is all booked up for the day.`,
      { voice: 'Polly.Salli' }
    )

    twiml.redirect({ method: 'POST' }, `/api/chooseService?redirect=true`)
    return res.send(twiml.toString())
  } else {
    gather.say(
      `${randomWord()}! ${barberName} will be excited. Time to book your appointment. Here is ${barberName}'s current schedule for today. Press:${availableTimes.map((time, index) => `\n(${index + 1}) for ${time}`)}`,
      { voice: 'Polly.Salli' }
    )
  }
  return res.send(twiml.toString())
}

export async function confirmation(req, res, next) {
  const keyPress = res.req.body.Digits
  const phoneNumber = phoneNumberFormatter(res.req.body.From)
  const customer: any = await database.findCustomerInDatabase(phoneNumber)
  const barber = customer.barber
  const firstName = customer.firstName
  const service = customer.service
  const total = customer.total
  let time;
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  twiml.say(
    `${randomWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today. Goodbye`,
    { voice: 'Polly.Salli' }
  )
  res.send(twiml.toString())

  let availableTimes = [
    '11am - 12pm',
    '12pm - 1pm',
    '1pm - 2pm',
    '2pm - 3pm',
    '3pm - 4pm',
    '4pm - 5pm',
    '5pm - 6pm',
    '6pm - 7pm',
    '7pm - 8pm'
  ]

  const foundBarber = await database.findBarberInDatabase(barber)
  const schedule = foundBarber.appointments
  const timesTaken = schedule.map(customer => customer.time);

  // filter out times available from times taken
  timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))

  time = availableTimes[parseInt(keyPress) - 1]

  try {

    await database.addAppointment(barber, { phoneNumber, firstName }, time)

    // TEST: Start cron job to send appointment alert message
    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)

    const seconds = currDate.getSeconds()
    const minutes = currDate.getMinutes()
    const hours = currDate.getHours()

    /*
    Seconds: 0-59
    Minutes: 0-59
    Hours: 0-23
    Day of Month: 1-31
    Months: 0-11 (Jan-Dec)
    Day of Week: 0-6 (Sun-Sat)
    */

    let alertHour
    const appointmentHour = time.split('-')[0]

    if (appointmentHour.includes('pm')) {
      alertHour = (parseInt(appointmentHour) + 12) - 1
    } else {
      alertHour = appointmentHour - 1
    }

    console.log('ALERT HOUR: ', alertHour)

    const reminderMessage = `REMINDER:\nYour appointment is less than an hour away.\nService: ${service} \nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`

    createJob(`0 ${minutes + 3} ${alertHour} 9 6 *`, phoneNumber, reminderMessage)

    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { time }
    )
  } catch (err) {
    next(err)
  }

  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body:
      `${randomWord()}! So to confirm \nYou've just made an appointment\nService: ${service} \nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`,
    to: phoneNumber
  })
}

export function errorMessage(req, res, next) {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()

  twiml.say('That was an invalid response', { voice: 'Polly.Salli' })
  twiml.redirect('/api/phoneAppointmentFlow')
  // Render the response as XML in reply to the webhook request
  res.send(twiml.toString())
  res.sendStatus(200)
}

/* *************** Text Message Flow ******************* */

function validateMessage(body: string, validResponses: string[]) {
  let extractedNumber;
  extractedNumber = body.match(/\d/gi)

  if (!extractedNumber) return false
  extractedNumber = extractedNumber[0]
  return validResponses.includes(extractedNumber)
}

function extractedNumber(body: string) {
  let extractedNumber
  extractedNumber = body.match(/\d/gi)

  if (!extractedNumber) return false
  return extractedNumber
}

export function phoneNumberFormatter(phoneNumber: string) {
  if (phoneNumber[0] === '+') return phoneNumber.slice(2)
  if (phoneNumber[0] === '1') return phoneNumber.slice(1)
  return phoneNumber
}

export async function textMessageFlow(req, res, next) {
  const phoneNumber = phoneNumberFormatter(req.body.From)

  try {
    let customer = await database.findCustomerInDatabase(phoneNumber)

    if (!customer) {
      const sendTextMessage = getTextMessageTwiml(res)
      sendTextMessage(
        `Thank you, this is Barber Sharp appointment system. I'm going to help book your appointment today. Can you please tell me your name?`
      )
      customer = await database.createCustomer(phoneNumber)
    } else {
      if (customer.stepNumber === '3') {
        req.barber = customer.barber
      }
    }

    req.customer = customer
    next()
  } catch (err) {
    next(err)
  }
}

export async function textGetName(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber = phoneNumberFormatter(req.body.From)


  try {
    if (req.customer.stepNumber == '7') {
      let message = `What type of service would you like today? Press: `

      for (let prop in serviceList) {
        message += `\n(${prop}) for ${serviceList[prop].service} - $ ${serviceList[prop].price}`
      }

      sendTextMessage(
        `Welcome back, ${req.customer.firstName}! ${message}`
      )

      await database.updateCustomer(
        phoneNumber,
        { 'stepNumber': '2' }
      )
    } else {
      await database.updateCustomer(
        phoneNumber,
        { 'firstName': userMessage }
      )

      let message = `What type of service would you like today? Press: `

      for (let prop in serviceList) {
        message += `\n(${prop}) for ${serviceList[prop].service} - $ ${serviceList[prop].price}`
      }

      sendTextMessage(message)

      await database.updateCustomer(
        phoneNumber,
        { 'stepNumber': '2' }
      )

      next()
    }
  } catch (err) {
    next(err)
  }
}

export async function textChooseService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)

  let services = [], total = 0

  let message = `What type of service would you like today? Press: `

  for (let prop in serviceList) {
    message += `\n(${prop}) for ${serviceList[prop].service} - $ ${serviceList[prop].price}`
  }

  console.log('USER RESPONSE', userMessage)

  userMessage.split(',').forEach(n => {
    const service = serviceList[n].service
    const price = serviceList[n].price

    services.push(service)
    total += price
  })

  console.log('=====================')
  console.log(services, total)
  console.log('=====================')


  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'service': services, 'total': total, 'stepNumber': '3' }
    )

    sendTextMessage(
      `Would you like any grapic designs or hair drawings today for $5+\nPress: \n(1) for Yes\n(2) for No`
    )

  } catch (err) {
    console.error(err, 'error')
    next(err)
  }
}

export async function textAdditionalService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const validResponses = ['1', '2']
  const validatedResponse = validateMessage(userMessage, validResponses)

  let additionalService
  let total = req.customer.total

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if (index === 0) return response
      if (index === validResponses.length - 1) return ` or ${response}`
      return ' ' + response
    })}\nWould you like any grapic designs or hair drawings today for $5+\nPress: \n(1) for Yes\n(2) for No`)

  switch (userMessage) {
    case '1':
      total += 5
      additionalService = 'Yes'
      break
    case '2':
      additionalService = 'No'
      break
  }

  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { additionalService, total, 'stepNumber': '4' }
    )

    sendTextMessage(
      `Okay, Which barber would you like to use today? Press: \n(1) for Kelly\n(2) for Anson\n(3) for Idris`
    )
  } catch (err) {
    next(err)
  }
}

export async function textChoseBarber(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const validResponses = ['1', '2', '3']
  const validatedResponse = validateMessage(userMessage, validResponses)
  let barberName

  if (!validatedResponse) {
    return sendTextMessage(`You must choose a valid response. Which barber would you like to use today? Press: \n(1) for Kelly\n(2) for Anson\n(3) for Idris`)
  }

  switch (userMessage) {
    case '1':
      barberName = 'Kelly'
      break
    case '2':
      barberName = 'Anson'
      break
    case '3':
      barberName = 'Idris'
      break
  }

  let availableTimes = [
    '11am - 12pm',
    '12pm - 1pm',
    '1pm - 2pm',
    '2pm - 3pm',
    '3pm - 4pm',
    '4pm - 5pm',
    '5pm - 6pm',
    '6pm - 7pm',
    '7pm - 8pm'
  ]

  await database.findBarberInDatabase(barberName).then(barber => {
    console.log('===BARBER=== ', barber)
    if (barber.appointments) {
      const schedule = barber.appointments
      const timesTaken = schedule.map(customer => customer.time);

      // filter out times available from times taken
      timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))
    }
  })

  if (availableTimes.length > 0) {
    sendTextMessage(
      `Awesome! ${barberName} will be excited. Here are his available times\nPress:${availableTimes.map((time, index) => `\n(${index + 1}) for ${time}`)}`
    )
    await database.updateCustomer(
      phoneNumber,
      { stepNumber: '5', barber: barberName }
    )
  } else {
    sendTextMessage(
      `Uh-oh, it looks that that barber doesn't have any time.`
    )
  }
}

export async function textGetConfirmation(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const validResponses = ['1', '2']
  const validatedResponse = validateMessage(userMessage, validResponses)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const customer: any = await database.findCustomerInDatabase(phoneNumber)
  const { barber, service, total, time } = customer

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if (index === 0) return response
      if (index === validResponses.length - 1) return ` or ${response}`
      return ' ' + response
    })}\nPress:\n(1) for YES\n(2) for NO`)

  if (userMessage === '1') {
    sendTextMessage(`Great! We are looking forward to seeing you!`)

    // TEST: Start cron job to send appointment alert message -- Break off into own function
    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)

    const minutes = currDate.getMinutes()

    const appointmentHour = time.split('-')[0]
    let alertHour

    if (appointmentHour.includes('pm')) {
      alertHour = (parseInt(appointmentHour) + 12) - 1
    } else {
      alertHour = appointmentHour - 1
    }

    const reminderMessage = `REMINDER:\nYour appointment is less than an hour away.\nService: ${service} \nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`

    createJob(`0 ${minutes + 3} ${alertHour} 9 6 *`, phoneNumber, reminderMessage)

  } else {
    sendTextMessage(`Okay, let's fix it.`)
  }

  await database.updateCustomer(
    phoneNumberFormatter(req.body.From),
    { 'stepNumber': '7' }
  )
}


export async function textConfirmAppointmentTime(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const validResponses = ['1', '2', '3', '4', '5', '6', '7', '8']
  const validatedResponse = validateMessage(userMessage, validResponses)
  const sendTextMessage = getTextMessageTwiml(res)
  const service = req.customer.service;
  const barber = req.customer.barber;
  const total = req.customer.total;
  const firstName = req.customer.firstName;
  const phoneNumber = req.customer.phoneNumber
  let time;

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if (index === 0) return response
      if (index === validResponses.length - 1) return ` or ${response}`
      return ' ' + response
    })}\nPress:\n(1) for 11am to 12pm\n(2) for 12pm to 1pm\n(3) for 1pm to 2pm\n(4) for 2pm to 3pm\n(5) for 3pm to 4pm\n(6) for 4pm to 5pm\n(7) for 5pm to 6pm\n(8) for 6pm to 7pm`)

  let availableTimes = [
    '11am - 12pm',
    '12pm - 1pm',
    '1pm - 2pm',
    '2pm - 3pm',
    '3pm - 4pm',
    '4pm - 5pm',
    '5pm - 6pm',
    '6pm - 7pm',
    '7pm - 8pm'
  ]

  await database.findBarberInDatabase(barber).then(foundBarber => {
    const schedule = foundBarber.appointments
    const timesTaken = schedule.map(customer => customer.time);
    // filter out times available from times taken
    timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))
  })

  time = availableTimes[parseInt(userMessage) - 1]
  sendTextMessage(`Awesome! Here are your appointment details:\n\nService: ${service} \nBarber: ${barber}\nTime: ${time}\nTotal: $${total}\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO`)

  try {
    await database.addAppointment(barber, { phoneNumber, firstName }, time)
    
    console.log('out of add appointment')
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'stepNumber': '6' }
    )

    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { time }
    )
  } catch (err) {
    next(err)
  }
}

