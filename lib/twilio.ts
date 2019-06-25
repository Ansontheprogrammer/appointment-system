import config from '../config/config'
import twilio from 'twilio'
import { Database, CustomerModel } from './database'

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()

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

export function phoneAppointmentFlow(req, res, next) {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/bookAppointment',
    method: 'POST',
    numDigits: 1
  })
  gather.say(
    'Hey, thank you for calling fades of gray!. We would love to service you today. Press one to book an appointment, Press two to speak to a barber',
    { voice: 'Polly.Joanna' }
  )

  // Render the response as XML in reply to the webhook request
  res.send(twiml.toString())
}

export function bookAppointment(req, res, next) {
  const keyPress = res.req.body.Digits
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/chosenBarber',
    method: 'POST',
    numDigits: 1,
    timeout: 7
  })

  if (keyPress === '1') {
    gather.say(
      'Great! Which barber would you like to use today? Press one for Julian, Press two for Anthony, Press 3 for Antadre',
      { voice: 'Polly.Joanna' }
    )
    return res.send(twiml.toString())
  } else if (keyPress === '2') {
    twiml.say(`Okay I'm connecting you to the shop right now.`, {
      voice: 'Polly.Joanna'
    })
    twiml.dial('9082097544')
    res.set('Content-Type', 'text/xml')
    return res.send(twiml.toString())
  } else {
    twiml.redirect('/api/phoneAppointmentFlow')
    return res.send(twiml.toString())
  }
}

export function chosenBarber(req, res, next) {
  const keyPress = res.req.body.Digits
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    action: '/api/confirmation',
    method: 'POST',
    numDigits: 1
  })

  if (keyPress === '1') {
    gather.say(
      'Awesome! Julian will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm',
      { voice: 'Polly.Joanna' }
    )
    return res.send(twiml.toString())
  } else if (keyPress === '2') {
    gather.say(
      'Awesome! Anthony will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm',
      { voice: 'Polly.Joanna' }
    )
    return res.send(twiml.toString())
  } else if (keyPress === '3') {
    gather.say(
      'Awesome! Jimmy will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm',
      { voice: 'Polly.Joanna' }
    )
    return res.send(twiml.toString())
  }
}

export function confirmation(req, res, next) {
  const customerPhoneNumber = phoneNumberFormatter(res.req.body.From)
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  twiml.say(
    'Okay so I will be sending you a confirmation text about your appointment. Thank you for working with us today. Goodbye',
    { voice: 'Polly.Joanna' }
  )
  res.send(twiml.toString())
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body:
      'This is a confirmation text from Fades of Gray about your appointment',
    to: customerPhoneNumber
  })
}

export function errorMessage(req, res, next) {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()

  twiml.say('That was an invalid response', { voice: 'Polly.Joanna' })
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
        `Thank you, this Fades of Gray appointment system. I'm going to help book your appointment today. Can you please tell me your name?`
      )
      customer = await database.createCustomer(phoneNumber)
    } else {
      if (customer.get('stepNumber') === '3'){
        req.barber = customer.get('sessionChosenBarber')
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
    await database.updateCustomer(
      phoneNumber,
      { 'firstName' : userMessage }
    )

    sendTextMessage(
      `Thanks, ${userMessage}! What type of service would you like today? Press: \n(1) for Adult Haircut - $25\n(2) for Child Haircut - $15\n(3) for Haircut and Shave - $35\n(4) Beard Trim - $10\n(5) Dry Shave with Clippers - $10\n(6) Razor Shave - $15\n(7) Hairline or Edge Up - $10\n(8) Mustache Trim - $7\n(9) Shampoo - $15`
    )

    await database.updateCustomer(
      phoneNumber,
      { 'stepNumber' : '2' }
    )
    next()
  } catch (err) {
    next(err)
  }
}

export async function textChooseService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)
  const validResponses = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const validatedResponse = validateMessage(userMessage, validResponses)

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if(index === 0) return response
      if(index === validResponses.length - 1) return ` or ${response}` 
      return ' ' + response
    })}\nWhat type of service would you like today? Press: \n(1) for Adult Haircut - $25\n(2) for Child Haircut - $15\n(3) for Haircut and Shave - $35\n(4) Beard Trim - $10\n(5) Dry Shave with Clippers - $10\n(6) Razor Shave - $15\n(7) Hairline or Edge Up - $10\n(8) Mustache Trim - $7\n(9) Shampoo - $15`)

  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'firstName' : userMessage }
    )

    sendTextMessage(
      `Thanks, ${userMessage}! Would you like any grapic designs or hair drawings today for $5+\nPress: \n(1) for Yes\n(2) for No`
    )

    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'stepNumber' : '2' }
    )
    next()
  } catch (err) {
    next(err)
  }
}

export async function textAdditionalService(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const sendTextMessage = getTextMessageTwiml(res)

  try {
    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'firstName' : userMessage }
    )

    sendTextMessage(
      `Thanks, ${userMessage}! Which barber would you like to use today? Press: \n(1) for Julian\n(2) for Anthony\n(3) for Antadre`
    )

    await database.updateCustomer(
      phoneNumberFormatter(req.body.From),
      { 'stepNumber' : '2' }
    )
    next()
  } catch (err) {
    next(err)
  }
}

export async function textChoseBarber(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const phoneNumber: string = req.body.From
  const validatedResponse = validateMessage(userMessage, ['1', '2', '3'])
  const sendTextMessage = getTextMessageTwiml(res)
  let barberName = '';

  if (!validatedResponse)
    return sendTextMessage(`You must a valid response 1, 2 or 3\nPress: \n(1) for Julian\n(2) for Anthony\n(3) for Antadre`)

  try {
    await database.updateCustomer(
      phoneNumberFormatter(phoneNumber),
      { 'stepNumber' : '3' }
    )
  } catch (err) {
    next(err)
  }

  switch (userMessage) {
    case '1':
      barberName = 'Julian'
      break
    case '2':
      barberName = 'Anthony'
      break
    case '3':
      barberName = 'Jimmy'
      break
  }

  sendTextMessage(
    `Awesome! ${barberName} will be excited. Press:\n(1) for 11am to 12pm\n(2) for 12pm to 1pm\n(3) for 1pm to 2pm\n(4) for 2pm to 3pm\n(5) for 3pm to 4pm\n(6) for 4pm to 5pm\n(7) for 6pm to 7pm\n(8) for 7pm to 8pm`
  )
  
  await database.updateCustomer(
    phoneNumberFormatter(req.body.From),
    { 'stepNumber' : '3' }
  )

  await database.updateCustomer(
    phoneNumberFormatter(req.body.From),
    { 'sessionChosenBarber' : barberName }
  )
  next()
}


export async function textConfirmAppointmentTime(req, res, next) {
  const userMessage: string = extractText(req.body.Body)
  const validResponses = ['1', '2', '3', '4', '5', '6', '7', '8']
  //Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm
  const validatedResponse = validateMessage(userMessage, validResponses)
  const sendTextMessage = getTextMessageTwiml(res)
  let time;

  if (!validatedResponse)
    return sendTextMessage(`You must choose a valid response ${validResponses.map((response, index) => {
      if(index === 0) return response
      if(index === validResponses.length - 1) return ` or ${response}` 
      return ' ' + response
    })}\nPress:\n(1) for 11am to 12pm\n(2) for 12pm to 1pm\n(3) for 1pm to 2pm\n(4) for 2pm to 3pm\n(5) for 3pm to 4pm\n(6) for 4pm to 5pm\n(7) for 5pm to 6pm\n(8) for 6pm to 7pm`)

  switch(userMessage){
    case '1':
      time = '11am - 12pm'
      break
    case '2':
      time = '12pm - 1pm'
      break
    case '3':
      time = '1pm - 2pm'
      break
    case '4':
      time = '2pm - 3pm'
      break
    case '5':
      time = '3pm - 4pm'
      break
    case '6':
      time = '4pm - 5pm'
      break
    case '7':
      time = '5pm - 6pm'
      break
    case '8':
      time = '6pm - 7pm'
      break
  }

  sendTextMessage(`Okay great! So to confirm \nYou have an appointment with ${req.barber} at ${time}\nAlso would you like a graphic design or hair drawing for $5+ today?\nPress (1) for yes`)
}

