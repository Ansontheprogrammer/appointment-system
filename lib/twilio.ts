import config from '../config/config'
import twilio from 'twilio'
import { Database } from './database'
import { serviceList, SERVICES } from './shopData'
import { createJob } from './cron'
import { Scheduler } from '@ssense/sscheduler'
import moment, { duration } from 'moment'

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()
const scheduler = new Scheduler()

const introWords = ['Great', 'Thanks', 'Fantastic', "Awesome", 'Amazing', 'Sweet', 'Okay', 'Phenominal'];
const introGreetingWords = ["What's good", "How you doing", "How you been", 'Long time no see']

const randomWord = () => introWords[Math.floor(Math.random() * introWords.length)]
const randomGreeting = () => introGreetingWords[Math.floor(Math.random() * introGreetingWords.length)]

export type BARBER_APPOINTMENTS = {
  from: string,
  duration: number
}

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

export function callBarbershop(res) {
  const twiml = new VoiceResponse()
  twiml.say(`${randomWord()}! I'm connecting you to the shop right now.`, {
    voice: 'Polly.Salli'
  })
  twiml.dial(config.BARBERSHOP_PHONE_NUMBER)
  res.set('Content-Type', 'text/xml')
  return res.send(twiml.toString())
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
    'Thank you for calling Barber Sharp!. We would love to service you today. What type of service would you like? Please choose one or more of the following. Press pound when your finish. \n(1) for Adult Haircut\n(2) for Child Haircut\n(3) for Haircut and Shave\n(4) Beard Trim\n(5) Dry Shave with Clippers\n(6) Razor Shave\n(7) Hairline or Edge Up\n(8) Mustache Trim.(9) Shampoo',
    { voice: 'Polly.Salli' }
  )

  if (!customer) await database.createCustomer(phoneNumber)

  res.send(twiml.toString())
}

export async function chooseService(req, res, next) {
  const keyPress = res.req.body.Digits
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/chosenBarber',
    method: 'POST',
    numDigits: 1,
    timeout: 7
  })

  // Handle if we have a redirect, we want to check if key press is truthy first
  if (!!keyPress) if (keyPress[0] === '0') return callBarbershop(res)

  if (res.req.query.redirect) {
    const barbers = [
      'Kelly',
      'Anson',
      'Idris'
    ]
    const barbersWithoutTakenBarber = barbers.filter(barber => barber !== res.req.query.barber)
    gather.say(
      `Which barber would you like today? ${barbersWithoutTakenBarber.map((barber, index) => `Press ${index + 1} for ${barber}`)}`,
      { voice: 'Polly.Salli' }
    )
    return res.send(twiml.toString())
  }

  let services = [], total = 0

  if (!!keyPress) {
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
      gather.say(
        `${randomWord()}! So you would like a ${services} and your current total is $${total}. Which barber would you like today? Press one for Kelly, Press two for Anson, Press 3 for Idris`,
        { voice: 'Polly.Salli' }
      )
      return res.send(twiml.toString())
    } catch (err) {
      next(err)
    }
  } else {
    gather.say(
      `Which barber would you like today? Press one for Kelly, Press two for Anson, Press 3 for Idris`,
      { voice: 'Polly.Salli' }
    )
    return res.send(twiml.toString())
  }
}

export async function chosenBarber(req, res, next) {
  const keyPress = res.req.body.Digits
  const phoneNumber = phoneNumberFormatter(res.req.body.From)
  const validResponses = ['1', '2']
  const twiml = new VoiceResponse()
  let barberName
  let validatedResponse;
  const gather = twiml.gather({
    action: '/api/confirmation',
    method: 'POST',
    numDigits: 1
  })

  if (!!keyPress) validatedResponse = validateMessage(keyPress, validResponses)

  if (!!keyPress) if (!validatedResponse) return errorMessage(res, '/api/chooseService')

  if (!!keyPress) if (keyPress[0] === '0') return callBarbershop(res)

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

  // set barber name if this is a redirect
  if (keyPress === undefined) {
    const customer = await new Database().findCustomerInDatabase(phoneNumber)
    barberName = customer.barber
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
    const schedule = barber.appointments
    const timesTaken = schedule.map(customer => customer.time);

    // filter out times available from times taken
    timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))
  })

  if (!availableTimes.length) {
    twiml.say(
      `I'm so sorry! ${barberName} is all booked up for the day.`,
      { voice: 'Polly.Salli' }
    )
    twiml.redirect({ method: 'POST' }, `/api/chooseService?redirect=true&barber=${barberName}`)
    return res.send(twiml.toString())
  } else {
    if (keyPress === undefined) {
      gather.say(
        `Here is ${barberName}'s current schedule for today. Press:${availableTimes.map((time, index) => `\n(${index + 1}) for ${time}`)}`,
        { voice: 'Polly.Salli' }
      )
    }
    gather.say(
      `${randomWord()}! ${barberName} will be excited. Time to book your appointment. Here is ${barberName}'s current schedule for today. Press:${availableTimes.map((time, index) => `\n(${index + 1}) for ${time}`)}`,
      { voice: 'Polly.Salli' }
    )
    await database.updateCustomer(
      phoneNumber,
      { barber: barberName }
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
  const services = customer.service
  const total = customer.total
  let time;
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  if (!!keyPress) if (keyPress[0] === '0') return callBarbershop(res)

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

  if (time === undefined) return errorMessage(res, '/api/chosenBarber')

  twiml.say(
    `${randomWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today. Goodbye`,
    { voice: 'Polly.Salli' }
  )
  res.send(twiml.toString())

  try {
    await database.addAppointment(barber, { phoneNumber, firstName }, time)

    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)
    const minutes = currDate.getMinutes()

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

    if (appointmentHour.includes('pm')) alertHour = (parseInt(appointmentHour) + 12) - 1
    else alertHour = appointmentHour - 1

    const reminderMessage = `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(service => `\n${service}`)}\n\nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`

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
      `${randomWord()}! So to confirm \nYou've just made an appointment\nService: ${services.map(service => `\n${service}`)}\n\nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`,
    to: phoneNumber
  })
}

export function errorMessage(res, redirectUrl: string) {
  const twiml = new VoiceResponse()

  twiml.say('That was an invalid response', { voice: 'Polly.Salli' })
  twiml.redirect({ method: 'POST' }, redirectUrl)
  res.send(twiml.toString())
}

/* *************** Text Message Flow ******************* */


export function getAvailableTimes(duration: number, interval: number, allocatedTimes: BARBER_APPOINTMENTS[], from: string, to: string) {
  return scheduler.getIntersection({
    from,
    to,
    duration,
    interval,
    schedules: [
      {
        weekdays: {
          from: '10:00', to: '20:00',
        },
        saturday: {
          from: '11:00', to: '20:00',
        },
        unavailability: [
          { from: `${from} 13:00`, to: `${from} 14:00` }
        ],
        allocated: []
      }
    ]
  })[from]
}

export function getApproximateTimes(barbersAllocatedTimes: any) {
  return barbersAllocatedTimes
    .filter(availability => availability.available)
    .map(availability => moment(availability.time, 'HH:mm').format('hh:mm a').slice(0, 2))
    .map(availability => {
      if (availability.slice(0, 1) === '0') return availability.slice(1).concat(' ' + 'pm')
      if (availability === '12') return availability.concat(' ' + 'pm')
      return availability.concat(' ' + 'am')
    })
    .filter((availability, index, self) => self.indexOf(availability) === index)
}

export function getExactTimes(barbersAllocatedTimes: any) {
  return barbersAllocatedTimes
    .filter(availability => availability.available)
    .map(availability => moment(availability.time, 'HH:mm').format('hh:mm a'))
}

function validateMessage(body: string, validResponses: string[]) {
  let extractedNumber;
  extractedNumber = body.match(/\d/gi)

  if (!extractedNumber) return false
  extractedNumber = extractedNumber[0]
  return validResponses.includes(extractedNumber)
}

function extractedNumbers(body: string) {
  const extractedNumbers = body.match(/\d/gi)
  if (extractedNumbers.length === 1) {
    if (extractedNumbers[0].length > 1) return extractedNumbers[0].split('')
    else return extractedNumbers
  }
  return extractedNumbers
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

export function getBarberAppointments(req?, approximate?: boolean, services?: SERVICES[], barber?: any): string[] {
  const from = moment().format('YYYY-MM-DD')
  const to = moment(from).add(1, 'day').format('YYYY-MM-DD')
  let totalDuration = 0;
  let barbersAllocatedTimes;
  if (!!req) {
    req.customer.service.forEach(service => totalDuration += service.duration)
    barbersAllocatedTimes = req.customer.barber.appointments;
  }
  else {
    services.forEach(service => totalDuration += service.duration)
    barbersAllocatedTimes = barber.appointments;
  }
  const availableTimes = getAvailableTimes(totalDuration, 15, barbersAllocatedTimes, from, to)
  
  if (approximate) return getApproximateTimes(availableTimes)
  else return getExactTimes(availableTimes)
}

export async function textGetName(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber = phoneNumberFormatter(req.body.From)
  let message = `Text (reset) at any time to reset your appointment. \n\nWhat type of service would you like today? Press: \n`

  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

  for (let prop in serviceList) {
    message += `\n(${prop}) for ${serviceList[prop].service} - $ ${serviceList[prop].price}`
  }

  try {
    if (req.customer.stepNumber == '7') {
      // Revisting customer
      console.log('===REVISITING CUSTOMER===')
      sendTextMessage(`Welcome back, ${req.customer.firstName}! \n${message}`)

      await database.updateCustomer(
        phoneNumber,
        { 'stepNumber': '2' }
      )
    } else {
      if (!!req.customer.firstName) {
        sendTextMessage(message)

        await database.updateCustomer(
          phoneNumber,
          { 'stepNumber': '2' }
        )
      }

      // First time customer is using system
      await database.updateCustomer(
        phoneNumber,
        { 'firstName': userMessage }
      )

      sendTextMessage(message)

      await database.updateCustomer(
        phoneNumber,
        { 'stepNumber': '2' }
      )
    }
  } catch (err) {
    next(err)
  }
}

export async function textChooseService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  let services = [], total = 0

  extractedNumbers(userMessage).forEach(n => {
    const service = serviceList[n].service
    const price = serviceList[n].price
    const duration = serviceList[n].duration

    services.push({ service, duration })
    total += price
  })

  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'service': services, 'total': total, 'stepNumber': '3' }
    )
    sendTextMessage(`Would you like any grapic designs or hair drawings today for $5+\nPress: \n(1) for Yes\n(2) for No`)
  } catch (err) { next(err) }
}

function resetUser(phoneNumber: string, sendTextMessage: any) {
  let message = `Okay let's start from the top! \n\nWhat type of service would you like today? Press: \n`

  for (let prop in serviceList) {
    message += `\n(${prop}) for ${serviceList[prop].service} - $ ${serviceList[prop].price}`
  }
  sendTextMessage(message)
  database.updateCustomer(phoneNumber, { 'stepNumber': '2' })
}

export async function textAdditionalService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const validResponses = ['1', '2']
  const validatedResponse = validateMessage(userMessage, validResponses)
  const phoneNumber = phoneNumberFormatter(req.body.From);
  let additionalService
  let total = req.customer.total

  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

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

    sendTextMessage(`Okay, Which barber would you like to use today? Press: \n(1) for Kelly\n(2) for Anson\n(3) for Idris`)
  } catch (err) {
    next(err)
  }
}

export async function textChoseApproximateTime(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const validResponses = ['1', '2', '3']
  const validatedResponse = validateMessage(userMessage, validResponses)
  let barberName

  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

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

  const approximateTimes = getBarberAppointments(req, true)

  if (approximateTimes.length > 0) {
    sendTextMessage(`Awesome! ${barberName} will be excited. Here are their available times\nPress:${approximateTimes.map((slot, i) => `\n(${i + 1}) for ${slot}`)}`)
    await database.updateCustomer(
      phoneNumber,
      { stepNumber: '5', barber: barberName }
    )
  } else {
    sendTextMessage(`Uh-oh, it looks that that barber doesn't have any time.`)
  }
}


export async function textChoseExactTime(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const barberSchedule = getBarberAppointments(req, true)
  const validResponses = barberSchedule.map((time, index) => (index + 1).toString())
  const validatedResponse = validateMessage(userMessage, validResponses)
  let barberName

  // converter for approximate times
  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

  if (!validatedResponse) {
    return sendTextMessage(`You must choose a valid response. Here are their available times\nPress:${barberSchedule.map((slot, i) => `\n(${i + 1}) for ${slot}`)}`)
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

  const exactTimes = getBarberAppointments(req, false)
  const chosenApproximateTime = exactTimes[parseInt(userMessage) + 1]

  if (exactTimes.length > 0) {
    sendTextMessage(`Awesome! so which time would you like exactly. Here are their available times\nPress:${exactTimes.map((slot, i) => `\n(${i + 1}) for ${slot}`)}`)
    await database.updateCustomer(
      phoneNumber,
      { stepNumber: '6', approximateTime: chosenApproximateTime }
    )
  } else {
    sendTextMessage(`Uh-oh, it looks that that barber doesn't have any time.`)
  }
}

export async function textConfirmAppointmentTime(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const validResponses = ['1', '2', '3', '4', '5', '6', '7', '8']
  const validatedResponse = validateMessage(userMessage, validResponses)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const sendTextMessage = getTextMessageTwiml(res)
  const services = req.customer.service;
  const barber = req.customer.barber;
  const total = req.customer.total;

  let time;

  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if (index === 0) return response
      if (index === validResponses.length - 1) return ` or ${response}`
      return ' ' + response
    })}\nPress:\n(1) for 11am to 12pm\n(2) for 12pm to 1pm\n(3) for 1pm to 2pm\n(4) for 2pm to 3pm\n(5) for 3pm to 4pm\n(6) for 4pm to 5pm\n(7) for 5pm to 6pm\n(8) for 6pm to 7pm`)

  let availableTimes = []

  await database.findBarberInDatabase(barber).then(foundBarber => {
    const schedule = foundBarber.appointments
    const timesTaken = schedule.map(customer => customer.time);
    // filter out times available from times taken
    timesTaken.forEach(time => availableTimes.splice(availableTimes.indexOf(time), 1))
  })

  time = availableTimes[parseInt(userMessage) - 1]
  sendTextMessage(`Awesome! Here are your appointment details:\n\nService: ${services.map(service => `\n${service}`)}\n\nBarber: ${barber}\nTime: ${time}\nTotal: $${total}\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO`)

  try {
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

export async function textGetConfirmation(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const validResponses = ['1', '2']
  const validatedResponse = validateMessage(userMessage, validResponses)
  const sendTextMessage = getTextMessageTwiml(res)
  const phoneNumber: string = phoneNumberFormatter(req.body.From)
  const customer: any = await database.findCustomerInDatabase(phoneNumber)
  const { barber, service, total, time, firstName } = customer

  console.log('===CUSTOMER===', customer)

  if (userMessage.toLowerCase() === 'reset') return resetUser(phoneNumber, sendTextMessage)

  if (!validatedResponse) return sendTextMessage(`You must choose a valid response. Press:\n(1) for YES\n(2) for NO`)

  if (userMessage === '1') {
    sendTextMessage(`Great! We are looking forward to seeing you!`)
    await database.addAppointment(barber, { phoneNumber, firstName }, time)

    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)
    const minutes = currDate.getMinutes()
    const appointmentHour = time.split('-')[0]
    const alertHour = appointmentHour.includes('pm') ? (parseInt(appointmentHour) + 12) - 1 : appointmentHour - 1

    const reminderMessage = `REMINDER:\nYour appointment is less than an hour away.\nService: ${service.map(service => `\n${service}`)} \n\nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`
    createJob(`0 ${minutes + 1} ${alertHour} 9 6 *`, phoneNumber, reminderMessage)

  } else {
    sendTextMessage(`Okay, let's fix it.`)
  }

  await database.updateCustomer(
    phoneNumberFormatter(req.body.From),
    { 'stepNumber': '7' }
  )
}