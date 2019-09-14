import config from '../config/config'
import twilio from 'twilio'
import {
  Database,
  barbersInShop
} from './database'
import serviceList from './shopData'
import * as types from './'
import { Scheduler, TimeAvailability } from '@ssense/sscheduler'
import moment from 'moment'
import * as utils from './utils'
export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()
const scheduler = new Scheduler()

export function getAvailableTimes(
  duration: number,
  interval: number,
  allocatedTimes: types.ALLOCATED_TIMES[],
  from: string,
  to: string,
  barber: types.BARBER
): TimeAvailability[] {
  // set time to get available times
  let fromTime = barberShopAvailablilty.open
  let toTime = barberShopAvailablilty.closed

  return scheduler.getIntersection({
    from,
    to,
    duration,
    interval,
    schedules: [
      {
        weekdays: {
          from: fromTime,
          to: toTime
        },
        saturday: {
          from: fromTime,
          to: toTime
        },
        unavailability: [
          {
            from: `${from} ${barber.unavailabilities.lunch.from}`,
            to: `${from} ${barber.unavailabilities.lunch.to}}`
          },
          ...barber.unavailabilities.offDays,
          ...barber.unavailabilities.unavailableTimes,
          ...barber.unavailabilities.vacations
        ],
        allocated: allocatedTimes
      }
    ]
  })[from]
}

export function getBarberAppointments(
  services: types.SERVICES[],
  barber: types.BARBER,
  date?: string
): string[] {
  const currentDateAndTime = moment()
  const currentTime = parseInt(currentDateAndTime.format('H'))
  let from = currentDateAndTime.format('YYYY-MM-DD')
  const currentDayOfTheWeek = new Date().getDay()
  // check if barbershop is closed and move the user to make an appointment for the next day
  if (
    currentTime > parseInt(barberShopAvailablilty.closed) ||
    currentTime < parseInt(barberShopAvailablilty.open)
  ) {
    if (currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Monday.index)
      from = moment(from)
        .add(barberShopAvailablilty.daysClosed.Monday.nextAvailableDay, 'day')
        .format('YYYY-MM-DD')
    else if (
      currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Sunday.index
    )
      from = moment(from)
        .add(barberShopAvailablilty.daysClosed.Sunday.nextAvailableDay, 'day')
        .format('YYYY-MM-DD')
    else
      from = moment(from)
        .add(1, 'day')
        .format('YYYY-MM-DD')
  }

  if (!!date) from = moment(date).format('YYYY-MM-DD')

  let to = moment(from)
    .add(1, 'day')
    .format('YYYY-MM-DD')

  const barbersAllocatedTimes = barber.appointments.map(
    appointment => appointment.details.time
  )
  let totalDuration = 0
  // sum up total durations
  services.forEach(service => (totalDuration += service.duration))
  let availableTimes = getAvailableTimes(
    totalDuration,
    15,
    barbersAllocatedTimes,
    from,
    to,
    barber
  )
  if (!availableTimes) return []
  return formatAllocatedTimes(availableTimes).map(time =>
    moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm')
  )
}

export function formatAllocatedTimes(
  barbersAllocatedTimes: TimeAvailability[]
) {
  return barbersAllocatedTimes
    .filter(availability => availability.available)
    .map(availability => moment(availability.time, 'HH:mm').format('h:mm a'))
}

export const barberShopAvailablilty = {
  open: '10',
  closed: '19',
  daysClosed: {
    // formatted for datetime object
    Monday: {
      index: 1,
      nextAvailableDay: 1
    },
    Sunday: {
      index: 0,
      nextAvailableDay: 2
    }
  }
}

export function createBarber(req, res, next) {
  /**
   * @req body = BARBER
   */
  new Database().createBarber(req.body as types.BARBER).then(() => {
    res.sendStatus(200)
  }, next)
}

export function sendShopIsClosedMessage(phoneNumber, res) {
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: 'The shop is currently closed\n',
    to: phoneNumber
  })
  sendBookLaterDateLink(phoneNumber)
}

export class UserMessageInterface {
  agreeWords = [
    'Great',
    'Thanks',
    'Fantastic',
    'Awesome',
    'Amazing',
    'Sweet',
    'Okay',
    'Phenominal'
  ]
  introGreetingWords = ['How you doing', 'How you been', 'Long time no see']
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`
  friendlyFormat = 'ddd, MMMM Do, h:mm a'

  public generateRandomAgreeWord = () =>
    this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)]
  public generateRandomGreeting = () =>
    this.introGreetingWords[
      Math.floor(Math.random() * this.introGreetingWords.length)
    ]

  public generateConfirmationMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number,
    noConfirmation: boolean
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating confirmation message')
    time = moment(time, 'YYYY-MM-DD HH-mm').format(this.friendlyFormat)
    const message = `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      service => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}`
    if (noConfirmation) return message
    else
      return message.concat(
        '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
      )
  }

  public generateReminderMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating reminder message')
    time = moment(time, 'YYYY-MM-DD HH-mm').format('dddd, MMMM Do, h:mm a')
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
      service => `\n${service.service}`
    )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
  }

  public generateAvailableServicesMessage() {
    let message = `What type of service would you like today? \n\nPress multiple numbers for multiple services`

    for (let prop in serviceList) {
      message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
    }
    return message
  }

  public generateGetBarberAvailableTimesMessage(barberSchedule: string[]) {
    return `Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public generateErrorValidatingAppointmentTime(barberSchedule: string[]) {
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public generateChooseBarberMessage() {
    return `Which barber would you like today? Press: \n${barbersInShop.map(
      (barber, index) => `\n(${index + 1}) for ${barber}`
    )}`
  }

  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) for first available appointment time\n(2) to book an appointment for today\n(3) for later date`
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
}

export const UserMessage = new UserMessageInterface()

export async function cancelRecentAppointment(req, res) {
  const { phoneNumber, uuid } = req.customer
  const url = `eclipperz.netlify.com/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
  const message = `Here's a link to cancel your appointment \n${url}`
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: message,
    to: phoneNumber
  })
}

export async function sendBookLaterDateLink(phoneNumber: string) {
  const url = `https://eclipperz.netlify.com/cue`
  const message = `Here's a link to book at a later date ${url}`
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: message,
    to: phoneNumber
  })
}

export class TextSystem {
  public static getTextMessageTwiml(res: any) {
    return (message: string) => {
      const msg = new MessagingResponse()
      msg.message(message)
      res.writeHead(200, { 'Content-Type': 'text/xml' })
      return res.end(msg.toString())
    }
  }

  public static resetUser(phoneNumber: string, sendTextMessage: any) {
    sendTextMessage(
      `Okay let's start from the top! \n${UserMessage.chooseAppointmentTypeMessage}`
    )
    // reset user by deleting session variables
    const session = { stepNumber: '2' }
    const propsToUpdateUser = { session }
    database.updateCustomer(phoneNumber, propsToUpdateUser)
  }

  public async textMessageFlow(req, res, next) {
    const phoneNumber = phoneNumberFormatter(req.body.From)
    // if shop is closed currently send shop is closed message
    if (shopIsClosed) return sendShopIsClosedMessage(phoneNumber, res)

    try {
      let customer = await database.findCustomerInDatabase(phoneNumber)

      if (!customer) {
        const sendTextMessage = TextSystem.getTextMessageTwiml(res)
        sendTextMessage(
          `${UserMessage.generateRandomGreeting()}, this is Fades of Grey appointment system. I'm going to help book your appointment today. Can you please tell me your name?`
        )
        customer = await database.createCustomer(phoneNumber)
        return
      }

      req.customer = customer

      const userMessage: string = extractText(req.body.Body)
      // Handle if the user would like to reset the flow

      if (userMessage.toLowerCase() === 'reset') {
        const sendTextMessage = TextSystem.getTextMessageTwiml(res)
        return TextSystem.resetUser(req.customer.phoneNumber, sendTextMessage)
      }

      // Handle if the user would like to cancel the most recent appointment
      if (userMessage.toLowerCase() === 'remove') {
        return cancelRecentAppointment(req, res)
      }

      // Send user to the next step
      next()
    } catch (err) {
      next(err)
    }
  }

  public async textGetName(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const message = `Text (reset) at any time to reset your appointment. \n${UserMessage.chooseAppointmentTypeMessage}`
    const session = Object.assign(req.customer.session, { stepNumber: '2' })
    const propsToUpdateUser = { session, firstName: userMessage }

    sendTextMessage(message)

    try {
      await database.updateCustomer(req.customer.phoneNumber, propsToUpdateUser)
    } catch (err) {
      next(err)
    }
  }

  public async textGetAppointmentType(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = ['1', '2', '3']
    const validatedResponse = validateMessage(userMessage, validResponses)
    const { phoneNumber } = req.customer
    const { services } = req.customer.session
    let session, appointmentType
    if (!validatedResponse)
      return sendTextMessage(
        `Would you like to book the first available time, book an appointment for today or later day? \nPress: \n(1) for First Available\n(2) for Book an appointment today\n(3) for Book later date`
      )
    if (userMessage === '1' || userMessage === '2') {
      appointmentType = userMessage === '1' ? 'Walkin' : 'Book'
    } else {
      // Send user to website if they want to book at a later date
      const session = { stepNumber: '2' }
      const propsToUpdateUser = { session }
      database.updateCustomer(phoneNumber, propsToUpdateUser)
      sendBookLaterDateLink(phoneNumber)
      return
    }

    // handle if user has already selected services
    if (services) {
      session = Object.assign(req.customer.session, {
        stepNumber: '1',
        appointmentType,
        finishedGeneralSteps: true
      })
      const message = `${UserMessage.generateRandomAgreeWord()}, ${UserMessage.generateChooseBarberMessage()}`

      sendTextMessage(message)

      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    } else {
      session = Object.assign(req.customer.session, {
        stepNumber: '3',
        appointmentType
      })
      const message = `${UserMessage.generateRandomAgreeWord()}, ${UserMessage.generateAvailableServicesMessage()}`

      sendTextMessage(message)

      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    }
  }

  public async textChooseService(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = Object.keys(serviceList)
    const validatedResponse = validateMessage(userMessage, validResponses)

    if (!validatedResponse)
      return sendTextMessage(
        `You must choose one of the following. \n\n${UserMessage.generateAvailableServicesMessage()}`
      )
    let services = [],
      total = 0

    extractedNumbers(userMessage).forEach(n => {
      const service = serviceList[n].service
      const price = serviceList[n].price
      const duration = serviceList[n].duration

      services.push({ service, duration })
      total += price
    })

    const message = UserMessage.generateChooseBarberMessage()
    const session = Object.assign(req.customer.session, {
      stepNumber: '1',
      services,
      total,
      finishedGeneralSteps: true
    })
    const propsToUpdateUser = { session }
    sendTextMessage(message)

    try {
      await database.updateCustomer(req.customer.phoneNumber, propsToUpdateUser)
    } catch (err) {
      next(err)
    }
  }
}

export class TextBookAppointmentInterface extends TextSystem {
  public async textChoseApproximateTime(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = barbersInShop.map((time, index) =>
      (index + 1).toString()
    )
    const validatedResponse = validateMessage(userMessage, validResponses)
    let barberName: string, barber: BARBER, session

    if (!validatedResponse)
      return sendTextMessage(
        `You must choose a valid response. ${UserMessage.generateChooseBarberMessage()}`
      )

    barberName = barbersInShop[parseInt(userMessage) - 1]

    try {
      barber = await (database.findBarberInDatabase(barberName) as Promise<
        BARBER
      >)
    } catch (err) {
      next(err)
    }

    const barberSchedule = getBarberAppointments(
      req.customer.session.services,
      barber
    ).map(time =>
      moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat)
    )
    const message = `${UserMessage.generateRandomAgreeWord()}! We will let ${barberName} know your coming. ${UserMessage.generateGetBarberAvailableTimesMessage(
      barberSchedule
    )}`

    if (barberSchedule.length > 0) {
      sendTextMessage(message)
      session = Object.assign(req.customer.session, {
        stepNumber: '2',
        barber: barberName
      })
      try {
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    } else {
      session = Object.assign(req.customer.session, {
        stepNumber: '2',
        appointmentType: null,
        finishedGeneralSteps: false
      })

      try {
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } catch (err) {
        next(err)
      }
      // the barber is booked for the day
      sendTextMessage(
        'Uh oh! Looks like the barber is booked up for the day. Would you like to try another barber for their first available time, book an appointment or book at a later date? Press: \n(1) for first available time \n(2) to book appointment for today\n(3) to book appointment for later date '
      )
    }
  }

  public async textConfirmAppointmentTime(req, res, next) {
    const { barber, services, total } = req.customer.session
    const userMessage: string = extractText(req.body.Body)
    const barberInDatabase = await (database.findBarberInDatabase(
      barber
    ) as Promise<BARBER>)
    const barberSchedule = getBarberAppointments(services, barberInDatabase)
    const formattedBarberSchedule = barberSchedule.map(time =>
      moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat)
    )
    const validResponses = barberSchedule.map((time, index) =>
      (index + 1).toString()
    )
    const validatedResponse = validateMessage(userMessage, validResponses)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)

    if (userMessage.toLowerCase() === 'reset')
      return TextSystem.resetUser(req.customer.phoneNumber, sendTextMessage)

    if (!validatedResponse)
      return sendTextMessage(
        UserMessage.generateErrorValidatingAppointmentTime(
          formattedBarberSchedule
        )
      )

    const exactTime = barberSchedule[parseInt(userMessage) - 1]
    const confirmationMessage = UserMessage.generateConfirmationMessage(
      services,
      barber,
      exactTime,
      total,
      false
    )
    sendTextMessage(confirmationMessage)
    const session = Object.assign(req.customer.session, {
      stepNumber: '3',
      time: exactTime
    })

    try {
      await database.updateCustomer(req.customer.phoneNumber, { session })
    } catch (err) {
      next(err)
    }
  }

  public async textGetConfirmation(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const validResponses = ['1', '2']
    const validatedResponse = validateMessage(userMessage, validResponses)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const { firstName, phoneNumber } = req.customer
    const { barber, services, total, time } = req.customer.session
    let duration = 0
    services.forEach(service => (duration += service.duration))

    if (userMessage.toLowerCase() === 'reset')
      return TextSystem.resetUser(phoneNumber, sendTextMessage)

    if (!validatedResponse)
      return sendTextMessage(UserMessage.errorValidatingConfirmingAppointment)

    if (userMessage === '1') {
      sendTextMessage(UserMessage.confirmedAppointmentMessage)
      const appointmentData = {
        time: { from: time, duration },
        services,
        total
      }
      await database.addAppointment(
        barber,
        { phoneNumber, firstName },
        appointmentData
      )
      const dateWithTimeZone = new Date().toLocaleString('en-US', {
        timeZone: 'America/Mexico_City'
      })
      const currDate = new Date(dateWithTimeZone)
      const currentTime = parseInt(moment().format('H'))
      let date = currDate.getDate()
      const minutes = moment(time, 'h:mm a').format('m')
      const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
      const alertHour = appointmentHour.includes('pm')
        ? parseInt(appointmentHour) + 12
        : parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(
        services,
        barber,
        time,
        total
      )
      createJob(
        `0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`,
        phoneNumber,
        reminderMessage
      )
    } else {
      sendTextMessage(UserMessage.errorConfirmingAppointment)
    }

    // reset user's session
    const session = { stepNumber: '2' }

    try {
      await database.updateCustomer(phoneNumber, { session })
    } catch (err) {
      next(err)
    }
  }
}

export class TextWalkInAppointmentInterface extends TextSystem {
  public async textBarberForWalkinAppointment(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = barbersInShop.map((time, index) =>
      (index + 1).toString()
    )
    const validatedResponse = validateMessage(userMessage, validResponses)
    const { phoneNumber } = req.customer
    const { services, total } = req.customer.session
    let barberName, session

    if (!validatedResponse) {
      return sendTextMessage(
        `You must choose a valid response. ${UserMessage.generateChooseBarberMessage()}`
      )
    }

    barberName = barbersInShop[parseInt(userMessage) - 1]
    const barber = await database.findBarberInDatabase(barberName)
    const firstAvailableTime = getBarberAppointments(
      services,
      barber as BARBER
    )[0]

    if (!firstAvailableTime) {
      session = Object.assign(req.customer.session, {
        stepNumber: '2',
        appointmentType: null,
        finishedGeneralSteps: false
      })
      // the barber is booked for the day
      sendTextMessage(
        'Uh oh! Looks like the barber is booked up for the day. Would you like to try another barber for a walkin or book an appointment? Press: \n(1) for Try another barber \n(2) for Book'
      )
      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
      return
    } else {
      const confirmationMessage = UserMessage.generateConfirmationMessage(
        services,
        barberName,
        firstAvailableTime,
        total,
        false
      )
      session = Object.assign(req.customer.session, {
        stepNumber: '2',
        time: firstAvailableTime,
        barber: barberName
      })

      sendTextMessage(confirmationMessage)
      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    }
  }

  public async textWalkinSendConfirmation(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const validResponses = ['1', '2']
    const validatedResponse = validateMessage(userMessage, validResponses)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const { barber, services, total, time } = req.customer.session
    const { firstName, phoneNumber } = req.customer
    let duration = 0
    services.forEach(service => (duration += service.duration))

    if (!validatedResponse)
      return sendTextMessage(UserMessage.errorValidatingConfirmingAppointment)

    if (userMessage === '1') {
      sendTextMessage(UserMessage.confirmedAppointmentMessage)

      const customerInfo = {
        customerData: { phoneNumber, firstName },
        appointmentData: {
          time: { from: time, duration },
          services,
          total
        }
      }

      try {
        // Add appointment to barber schedule
        await database.addAppointment(
          barber,
          customerInfo.customerData,
          customerInfo.appointmentData
        )
      } catch (err) {
        next(err)
      }

      const dateWithTimeZone = new Date().toLocaleString('en-US', {
        timeZone: 'America/Mexico_City'
      })
      const currDate = new Date(dateWithTimeZone)
      const currentTime = parseInt(moment().format('H'))
      let date = currDate.getDate()

      // check if barbershop is closed and move the user to make an appointment for the next day
      if (currentTime > parseInt(barberShopAvailablilty.closed)) date += 1

      const minutes = moment(time, 'YYYY-MM-DD h:mm a').format('m')
      const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
      const alertHour = appointmentHour.includes('pm')
        ? parseInt(appointmentHour) + 12
        : parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(
        services,
        barber,
        time,
        total
      )
      createJob(
        `0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`,
        phoneNumber,
        reminderMessage
      )
    } else {
      sendTextMessage(UserMessage.errorConfirmingAppointment)
    }

    // reset user's session
    const session = { stepNumber: '2' }
    try {
      await database.updateCustomer(phoneNumber, { session })
    } catch (err) {
      next(err)
    }
  }
}

export class AppSystem {
  public async walkInAppointment(req, res, next) {
    const { barber, name, services } = req.body
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber)

    const customer = {
      phoneNumber,
      firstName: name
    }

    if (!Object.keys(services[0]).length) services.shift()

    let total = 0
    services.forEach(service => (total += service.price))

    let duration = 0
    services.forEach(service => (duration += service.duration))

    const barberInDatabase = await (database.findBarberInDatabase(
      barber
    ) as any)
    const firstAvailableTime = getBarberAppointments(
      services,
      barberInDatabase
    )[0]

    if (!firstAvailableTime) {
      // This barber is booked up for the day
      return res.sendStatus(400)
    }

    const confirmationMessage = UserMessage.generateConfirmationMessage(
      services,
      barber,
      firstAvailableTime,
      total,
      true
    )

    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: confirmationMessage,
      to: phoneNumber
    })

    const time = { from: firstAvailableTime, duration }
    const appointmentData = {
      time,
      services,
      total
    }

    await database.addAppointment(barber, customer, appointmentData)
    const dateWithTimeZone = new Date().toLocaleString('en-US', {
      timeZone: 'America/Mexico_City'
    })
    const currDate = new Date(dateWithTimeZone)
    const currentHour = moment().format('H')
    let date = currDate.getDate()

    // handle if barbershop is closed
    if (parseInt(currentHour) > parseInt(barberShopAvailablilty.closed)) {
      return res.send('Barbershop is closed').status(400)
    }

    const minutes = moment(firstAvailableTime, 'HH:mm').format('m')
    const alertHour = currentHour.includes('pm')
      ? parseInt(currentHour) + 12
      : parseInt(currentHour) - 1
    const reminderMessage = UserMessage.generateReminderMessage(
      services,
      barber,
      firstAvailableTime,
      total
    )
    createJob(
      `0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`,
      phoneNumber,
      reminderMessage
    )

    res.sendStatus(200)
  }

  public async notifyBarber(req, res, next) {
    const { customer, barberName } = req.body
    const { phoneNumber, name } = customer
    let date = customer.date
    date = moment(date, 'YYYY-MM-DD HH:mm').format('ddd, MMM Do, h:mm a')
    const message = `${name} just canceled their appointment for ${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`
    const barberData = await database.findBarberInDatabase(barberName)

    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: message,
      to: '9082097544'
    })
    res.sendStatus(200)
  }

  public async getBarberAvailableTimes(req, res, next) {
    // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
    const { barber, fromDate, services } = req.body
    if (!Object.keys(services[0]).length) services.shift()
    const barberInDatabase = await (database.findBarberInDatabase(
      barber
    ) as Promise<BARBER>)
    let availableTimes = getBarberAppointments(
      services,
      barberInDatabase,
      fromDate
    )
    availableTimes = availableTimes.map(time =>
      moment(time, 'YYYY-MM-DD HH:mm').format(UserMessage.friendlyFormat)
    )
    res.json({ availableTimes })
  }

  public bookAppointment(req, res, next) {
    /* 
      Formats:
        Date - MM-DD-YYYY
        Time - ddd, MMMM Do, h:mm a
    */

    const { barber, date, time, name, services } = req.body
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber)
    // remove first element if empty
    if (!Object.keys(services[0]).length) services.shift()
    const dayOfMonth = moment(date, 'MM-DD-YYYY').format('DD')
    const month = moment(date, 'MM-DD-YYYY').format('MM')
    const dateTime = `${date} ${time}`
    // format dateTime to set appointment and receive confirmation message
    const formattedDateTime = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format('YYYY-MM-DD HH:mm')

    let duration = 0
    services.forEach(service => (duration += service.duration))

    let total = 0
    services.forEach(service => (total += service.price))

    const customerInfo = {
      customerData: { phoneNumber, firstName: name },
      appointmentData: {
        time: { from: formattedDateTime, duration },
        services,
        total
      }
    }

    database.addAppointment(
      barber,
      customerInfo.customerData,
      customerInfo.appointmentData
    )

    // send confirmation
    const confirmationMessage = UserMessage.generateConfirmationMessage(
      services,
      barber,
      formattedDateTime,
      total,
      true
    )

    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: confirmationMessage,
      to: phoneNumber
    })

    const minutes = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format('mm')
    const appointmentHour = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format('H')
    const alertHour = parseInt(appointmentHour) - 1
    const reminderMessage = UserMessage.generateReminderMessage(
      services,
      barber,
      dateTime,
      total
    )
    createJob(
      `0 ${minutes} ${alertHour} ${dayOfMonth} ${month} *`,
      phoneNumber,
      reminderMessage
    )

    res.sendStatus(200)
  }
}
