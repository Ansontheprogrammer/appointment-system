import config from '../config/config'
import twilio from 'twilio'
import { Database, BARBER, CUSTOMER, ALLOCATED_TIMES } from './database'
import { serviceList, SERVICES } from './shopData'
import { createJob } from './cron'
import { Scheduler, TimeAvailability } from '@ssense/sscheduler'
import moment from 'moment'

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()
const scheduler = new Scheduler()

export type BARBER_APPOINTMENTS = {
  customer: CUSTOMER,
  details: {
    time: ALLOCATED_TIMES,
    total,
    duration
  }
  
}

export type UNAVAILABLETIMES = {
  from: string,
  to: string
}

const barbersInShop = ['Jesse', 'Kelly', 'Jimmy'];
const barberShopAvailablilty = {
  open: '10',
  closed: '19',
  daysClosed: {
    // formatted for datetime object
    'Monday': {
      index: 1,
      nextAvailableDay: 1
    },
    'Sunday': {
      index: 0,
      nextAvailableDay: 2
    }
  }
}

export function phoneNumberFormatter(phoneNumber: string) {
    if (phoneNumber[0] === '+') return phoneNumber.slice(2)
    if (phoneNumber[0] === '1') return phoneNumber.slice(1)
    return phoneNumber
  }

export function extractText(body: string): string {
  return String(body.match(/\w+/gi))
}

export function getAvailableTimes(duration: number, interval: number, allocatedTimes: ALLOCATED_TIMES[], from: string, to: string, barber: BARBER, appoximateTime?: string): TimeAvailability[] {
    // set time to get available times through
    let fromTime;
    let toTime;
  
    if(!!appoximateTime) {
      fromTime = appoximateTime
      toTime = (parseInt(appoximateTime) + 1).toString()
    }
    else {
      fromTime = barberShopAvailablilty.open;
      toTime = barberShopAvailablilty.closed
    }

    return scheduler.getIntersection({
      from,
      to,
      duration,
      interval,
      schedules: [
        {
          weekdays: {
            from: fromTime, to: toTime,
          },
          saturday: {
            from: fromTime, to: toTime,
          },
          unavailability: [
            barber.unavailabilities.lunch,
            ...barber.unavailabilities.offDays,
            ...barber.unavailabilities.unavailableTimes,
            ...barber.unavailabilities.vacations
          ],

          allocated: allocatedTimes
        }
      ]
    })[from]
  }

export function getBarberAppointments(services: SERVICES[], barber: BARBER, approximateTime?: string, fromTime?: string): string[] {
    const currentDateAndTime = moment()
    const currentTime = parseInt(currentDateAndTime.format('H'))
    let from = currentDateAndTime.format('YYYY-MM-DD')
    const currentDayOfTheWeek = new Date().getDay()
    // check if barbershop is closed and move the user to make an appointment for the next day
    if(currentTime > parseInt(barberShopAvailablilty.closed) || currentTime < parseInt(barberShopAvailablilty.open)){
      if(currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Monday.index) from = moment(from).add(barberShopAvailablilty.daysClosed.Monday.nextAvailableDay, 'day').format('YYYY-MM-DD')  
      else if(currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Sunday.index) from = moment(from).add(barberShopAvailablilty.daysClosed.Sunday.nextAvailableDay, 'day').format('YYYY-MM-DD') 
      else from = moment(from).add(1, 'day').format('YYYY-MM-DD')  
    }

    if(!!fromTime) from = moment(fromTime).add(1, 'day').format('YYYY-MM-DD')

    let to = moment(from).add(1, 'day').format('YYYY-MM-DD')
    const barbersAllocatedTimes = barber.appointments.map(appointment => appointment.details.time)
    let totalDuration = 0;
    // sum up total durations
    services.forEach(service => totalDuration += service.duration)

    let availableTimes
    if(!!approximateTime){
      availableTimes = getAvailableTimes(totalDuration, 15, barbersAllocatedTimes, from, to, barber, approximateTime)
    } else {
      availableTimes = getAvailableTimes(totalDuration, 15, barbersAllocatedTimes, from, to, barber)
    }
    
    return getApproximateTimes(availableTimes).map(time => moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm'))
}
  
export function getApproximateTimes(barbersAllocatedTimes: TimeAvailability[]) {
    return barbersAllocatedTimes
      .filter(availability => availability.available)
      .map(availability => moment(availability.time, 'HH:mm').format('h:mm a'))
}
  
export function validateMessage(body: string, validResponses: string[]) {
    let extractedNumber;
    extractedNumber = body.match(/\d/gi)
  
    if (!extractedNumber) return false
    extractedNumber = extractedNumber[0]
    return validResponses.includes(extractedNumber)
  }
  
export function extractedNumbers(body: string) {
    const extractedNumbers = body.match(/\d/gi)
    if (extractedNumbers.length === 1) {
      if (extractedNumbers[0].length > 1) return extractedNumbers[0].split('')
      else return extractedNumbers
    }
    return extractedNumbers
  }

export function createBarber(req, res, next) {
    /**
     * @req body = BARBER
     */
    new Database().createBarber((req.body as BARBER)).then(() => {
        res.sendStatus(200)
    }, next)
}

export async function cancelRecentAppointment(res){
  const sendTextMessage = TextSystem.getTextMessageTwiml(res)
  const url = 'eclipperz.netlify.com?phoneNumber=' + res.customer.phoneNumber
  sendTextMessage(`Here's a link to cancel your appointment ${url}`)
}

class UserMessageInterface {
  introWords = ['Great', 'Thanks', 'Fantastic', "Awesome", 'Amazing', 'Sweet', 'Okay', 'Phenominal'];
  introGreetingWords = ["How you doing", "How you been", 'Long time no see']
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book another appointment \nPress:\n(1) for Walkin \n(2) to Book`;
  chooseAppointmentTypeMessage = `Is this for a walkin or to book an appointment? \nPress: \n(1) for Walkin\n(2) for Book`;
  friendlyFormat = 'ddd, MMMM Do, h:mm a'

  public generateRandomAgreeWord = () => this.introWords[Math.floor(Math.random() * this.introWords.length)]
  public generateRandomGreeting = () => this.introGreetingWords[Math.floor(Math.random() * this.introGreetingWords.length)]

  public generateConfirmationMessage(services: SERVICES[], barberName: string, time: string, total: number){
    time = moment(time, 'YYYY-MM-DD HH-mm').format(this.friendlyFormat)
    return `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(service => `\n${service.service}`)}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO`
  }

  public generateReminderMessage(services: SERVICES[], barberName: string, time: string, total: number){
    time = moment(time, 'YYYY-MM-DD HH-mm').format('dddd, MMMM Do, h:mm a')
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(service => `\n${service.service}`)} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
  }

  public generateAvailableServicesMessage(){
    let message = `What type of service would you like today? \n\nPress multiple numbers for multiple services`
    
    for (let prop in serviceList) {
      message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
    }
    return message
  }

  public generateGetBarberAvailableTimesMessage(barberSchedule: string[]){
    return `Here are their available times\nPress:${barberSchedule.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
  }

  public generateErrorValidatingAppointmentTime(barberSchedule: string[]){
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
  }
  
  public generateChooseBarberMessage(){
    return `Which barber would you like today? Press: \n${barbersInShop.map((barber, index) =>  `\n(${index + 1}) for ${barber}`)}`
  }

  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart. \n(1) for Walkin\n(2) for Book`
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
}

const UserMessage = new UserMessageInterface()

export class PhoneSystem extends UserMessageInterface {
  public async phoneAppointmentFlow(req, res, next) {
    // Use the Twilio Node.js SDK to build an XML response
    const phoneNumber = phoneNumberFormatter(res.req.body.From)
    const twiml = new VoiceResponse()
    const gather = twiml.gather({
      action: '/api/chooseService',
      method: 'POST',
      finishOnKey: '#',
      timeout: 10
    })
    const customer = await database.findCustomerInDatabase(phoneNumber)
    let message = ``
    
    for (let prop in serviceList) {
      message += `(${prop}) for ${serviceList[prop].service}\n`
    }
    gather.say(
      `Thank you for calling Fades of Grey!. What type of service would you like? Please choose one or more of the following. Press pound when your finish. ${message}`,
    { voice: 'Polly.Salli' }
  )

    if (!customer) await database.createCustomer(phoneNumber)
    res.send(twiml.toString())
  }

  private async callBarbershop(res, next) {
    const phoneNumber = phoneNumberFormatter(res.req.body.From)
    try {
      const phoneSession = {}
      database.updateCustomer(phoneNumber, { phoneSession })
    } catch(err){
      next(err)
    }
    
    const twiml = new VoiceResponse()
    twiml.say(`${UserMessage.generateRandomAgreeWord()}! I'm connecting you to the shop right now.`, {
      voice: 'Polly.Salli'
    })
    twiml.dial(config.BARBERSHOP_PHONE_NUMBER)
    res.set('Content-Type', 'text/xml')
    return res.send(twiml.toString())
  }

  public async chooseService(req, res, next) {
    const keyPress = res.req.body.Digits
    const twiml = new VoiceResponse()
    const phoneNumber = phoneNumberFormatter(res.req.body.From)
    const gather = twiml.gather({
      action: '/api/chosenBarber',
      method: 'POST',
      numDigits: 1,
    })
  
    // Handle if we have a redirect, we want to check if key press is truthy first
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res, next)
  
    if (res.req.query.redirect) {
      const barbersWithoutTakenBarber = barbersInShop.filter(barber => barber !== res.req.query.barber)
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
        const duration = serviceList[n].duration
        services.push({service, duration})
        total += price
      })
      
      const phoneSession = { services, total }

      try {
        await database.updateCustomer(phoneNumber, { phoneSession })
        gather.say(
          `${UserMessage.generateRandomAgreeWord()}! So you would like a ${services.map(service => service.service)}. ${UserMessage.generateChooseBarberMessage()}`,
          { voice: 'Polly.Salli' }
        )
        return res.send(twiml.toString())
      } catch (err) {
        next(err)
      }
    } else {
      gather.say(UserMessage.generateChooseBarberMessage(), { voice: 'Polly.Salli' })
      return res.send(twiml.toString())
    }
  }

  public async chosenBarber(req, res, next) {
    const keyPress = res.req.body.Digits
    const phoneNumber = phoneNumberFormatter(res.req.body.From)
    const validResponses = barbersInShop.map((barbers, index) => (index + 1).toString())
    const twiml = new VoiceResponse()
    let barberName
    let validatedResponse;
    const gather = twiml.gather({
      action: '/api/confirmation',
      method: 'POST',
      numDigits: 2
    })
  
    if (!!keyPress) validatedResponse = validateMessage(keyPress, validResponses)
    if (!!keyPress) if (!validatedResponse) return this.errorMessage(res, '/api/chooseService')
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res, next)
    
    const customer = await new Database().findCustomerInDatabase(phoneNumber)
    // set barber name if this is a redirect
    if (keyPress === undefined) {
      barberName = customer.phoneSession.barber
    } else {
      barberName = barbersInShop[parseInt(keyPress) - 1]
    }
  
    let barber
    
    try {
      barber = await database.findBarberInDatabase(barberName)
    } catch(err){
      next(err)
    }

    const availableTimes = getBarberAppointments(customer.phoneSession.services, barber).map(time => moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))

    if (!availableTimes.length) {
      twiml.say(
        `I'm so sorry! ${barberName} is all booked up for the day.`,
        { voice: 'Polly.Salli' }
      )
      twiml.redirect({ method: 'POST' }, `/api/chooseService?redirect=true&barber=${barberName}`)
      return res.send(twiml.toString())
    } else {
      if (keyPress === undefined) {
        const dayForTimes = moment(availableTimes[0], UserMessage.friendlyFormat).format('dddd, MMMM Do')
        gather.say(
          `${UserMessage.generateRandomAgreeWord()} Here is ${barberName}'s current schedule for ${dayForTimes}. Press:${availableTimes.map((time, index) => `\n\n(${index + 1}) for ${moment(time, UserMessage.friendlyFormat).format('h:mm')}`)}`,
          { voice: 'Polly.Salli' }
        )
      }
      const dayForTimes = moment(availableTimes[0], UserMessage.friendlyFormat).format('dddd, MMMM Do')
      const phoneSession = Object.assign(customer.phoneSession, { barber: barberName })
      await database.updateCustomer(phoneNumber, { phoneSession})
      gather.say(
        `${UserMessage.generateRandomAgreeWord()} Here is ${barberName}'s current schedule for ${dayForTimes}. Press:${availableTimes.map((time, index) => `\n\n(${index + 1}) for ${moment(time, UserMessage.friendlyFormat).format('h:mm')}`)}`,
        { voice: 'Polly.Salli' }
      )
    }
    return res.send(twiml.toString())
  }

  public async confirmation(req, res, next) {
    const keyPress = res.req.body.Digits
    const phoneNumber = phoneNumberFormatter(res.req.body.From)
    const customer: any = await database.findCustomerInDatabase(phoneNumber)
    const barber = customer.phoneSession.barber
    const firstName = customer.firstName
    const services = customer.phoneSession.services
    const total = customer.phoneSession.total
    let time;
    let duration = 0;
    services.forEach(service => duration += service.duration)
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse()
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res, next)
  
    const foundBarber = await (database.findBarberInDatabase(barber) as Promise<BARBER>)
    
    const availableTimes = getBarberAppointments(customer.phoneSession.services, foundBarber)
   
    time = availableTimes[parseInt(keyPress) - 1]
    if (time === undefined) return this.errorMessage(res, '/api/chosenBarber')
  
    twiml.say(
      `${UserMessage.generateRandomAgreeWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today`,
      { voice: 'Polly.Salli' }
    )
    res.send(twiml.toString())
    
    const details = { 
      services, 
      time: {from: time, duration}, 
      total 
    }

    try {
      await database.addAppointment(barber, { phoneNumber, firstName }, details)
  
      let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
      let currDate = new Date(dateWithTimeZone)

      const minutes = moment(time, 'h:mm a').format('m');
      const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
      const alertHour = appointmentHour.includes('pm') ? parseInt(appointmentHour) + 12 : parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(services, barber, time, total)
      let date = currDate.getDate()
      createJob(`0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`, phoneNumber, reminderMessage)
      await database.updateCustomer(
        phoneNumberFormatter(req.body.From),
        { time }
      )
    } catch (err) {
      next(err)
    }
  
    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: `${UserMessage.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(service => `\n${service.service}`)}\n\nBarber: ${barber}\nTime: \n${time}\nTotal: $${total}`,
      to: phoneNumber
    })
  }
  
  private errorMessage(res, redirectUrl: string) {
    const twiml = new VoiceResponse()
  
    twiml.say('That was an invalid response', { voice: 'Polly.Salli' })
    twiml.redirect({ method: 'POST' }, redirectUrl)
    res.send(twiml.toString())
  }
}

export class TextSystem {
  public static getTextMessageTwiml(res: any){
    return (message: string) => {
      const msg = new MessagingResponse()
      msg.message(message)
      res.writeHead(200, { 'Content-Type': 'text/xml' })
      return res.end(msg.toString())
    }
  }

  public static resetUser(phoneNumber: string, sendTextMessage: any) {
    sendTextMessage(`Okay let's start from the top! \n${UserMessage.chooseAppointmentTypeMessage}`)
    // reset user by deleting session variables
    const session = { 'stepNumber': '2' }
    const propsToUpdateUser = { session }
    database.updateCustomer(phoneNumber, propsToUpdateUser)
  }

  public async textMessageFlow(req, res, next) {
    const phoneNumber = phoneNumberFormatter(req.body.From)

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
        return cancelRecentAppointment(res);
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
    const session = Object.assign(req.customer.session, { 'stepNumber': '2' })
    const propsToUpdateUser = { session, 'firstName': userMessage }

    sendTextMessage(message)

    try {
      await database.updateCustomer(req.customer.phoneNumber, propsToUpdateUser)
    } catch (err) {
      next(err)
    }
  }

  public async textGetAppointmentType(req, res, next){
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = ['1', '2']
    const validatedResponse = validateMessage(userMessage, validResponses)
    const { phoneNumber } = req.customer
    const { services } = req.customer.session
    let session;
    if(!validatedResponse) return sendTextMessage(`Is this for a walkin or to book an appointment? \nPress: \n(1) for Walkin\n(2) for Book`)
    
    const appointmentType = userMessage === '1' ? 'Walkin' : 'Book'
    
    // handle if user has already selected services
    if(services) {
      session = Object.assign(req.customer.session, { 'stepNumber': '1', appointmentType, finishedGeneralSteps: true})
      const message = `${UserMessage.generateRandomAgreeWord()}, ${UserMessage.generateChooseBarberMessage()}`
    
      sendTextMessage(message)

      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    }

    else {
      session = Object.assign(req.customer.session, { 'stepNumber': '3', appointmentType })
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
    const validResponses = Object.keys(serviceList);
    const validatedResponse = validateMessage(userMessage, validResponses)

    if(!validatedResponse) return sendTextMessage(`You must choose one of the following. \n\n${UserMessage.generateAvailableServicesMessage()}`)
    let services = [], total = 0

    extractedNumbers(userMessage).forEach(n => {
      const service = serviceList[n].service
      const price = serviceList[n].price
      const duration = serviceList[n].duration
  
      services.push({ service, duration })
      total += price
    })
    
    const message = UserMessage.generateChooseBarberMessage()
    const session = Object.assign(req.customer.session, { 'stepNumber': '1', services, total, finishedGeneralSteps: true})
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
    const validResponses = barbersInShop.map((time, index) => (index + 1).toString())
    const validatedResponse = validateMessage(userMessage, validResponses)
    let barberName: string, barber: BARBER, session
  
    if (!validatedResponse) return sendTextMessage(`You must choose a valid response. ${UserMessage.generateChooseBarberMessage()}`)
  
    barberName = barbersInShop[parseInt(userMessage) - 1]
    
    try {
      barber = await (database.findBarberInDatabase(barberName) as Promise<BARBER>)
    } catch (err){
      next(err)
    }


    const barberSchedule = getBarberAppointments(req.customer.session.services, barber).map(time => moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))
    const message = `${UserMessage.generateRandomAgreeWord()}! We will let ${barberName} know your coming. ${UserMessage.generateGetBarberAvailableTimesMessage(barberSchedule)}`

    if (barberSchedule.length > 0) {
      sendTextMessage(message)
      session = Object.assign(req.customer.session , { stepNumber: '2', barber: barberName })
      try {
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } catch(err){
        next(err)
      } 
    } else {
      session = Object.assign(req.customer.session , { 'stepNumber': '2', appointmentType: null, finishedGeneralSteps: false })

      try {
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } catch(err){
        next(err)
      } 
      // the barber is booked for the day
      sendTextMessage('Uh oh! Looks like the barber is booked up for the day. Would you like to try another barber for a walkin or book an appointment? Press: \n(1) for Walkin \n(2) for Book')
    }
  }
  
  public async textConfirmAppointmentTime(req, res, next) {
    const { barber, services, total, approximateTime } = req.customer.session
    const userMessage: string = extractText(req.body.Body)
    const barberInDatabase = await (database.findBarberInDatabase(barber) as Promise<BARBER>)
    const barberSchedule = getBarberAppointments(services, barberInDatabase, approximateTime)
    const validResponses = barberSchedule.map((time, index) => (index + 1).toString())
    const validatedResponse = validateMessage(userMessage, validResponses)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
  
    if (userMessage.toLowerCase() === 'reset') return TextSystem.resetUser(req.customer.phoneNumber, sendTextMessage)
  
    if (!validatedResponse) return sendTextMessage(UserMessage.generateErrorValidatingAppointmentTime(barberSchedule))
    
    const exactTime = barberSchedule[parseInt(userMessage) - 1]
    const confirmationMessage = UserMessage.generateConfirmationMessage(services, barber, exactTime, total)
    sendTextMessage(confirmationMessage)
    const session = Object.assign(req.customer.session , { stepNumber: '3', time: exactTime })

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
    let duration = 0;
    services.forEach(service => duration += service.duration)

    if (userMessage.toLowerCase() === 'reset') return TextSystem.resetUser(phoneNumber, sendTextMessage)
  
    if (!validatedResponse) return sendTextMessage(UserMessage.errorValidatingConfirmingAppointment)
    
    if (userMessage === '1') {
      sendTextMessage(UserMessage.confirmedAppointmentMessage)
      const appointmentData = {
        time: {from: time, duration},
        services, 
        total
      }
      await database.addAppointment(barber, { phoneNumber, firstName }, appointmentData)
      const dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
      const currDate = new Date(dateWithTimeZone)
      const currentTime = parseInt(moment().format('H'))
      let date = currDate.getDate()

      // check if barbershop is closed and move the user to make an appointment for the next day
      if(currentTime > parseInt(barberShopAvailablilty.closed)) date += 1
      const minutes = moment(time, 'h:mm a').format('m');
      const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
      const alertHour = appointmentHour.includes('pm') ? parseInt(appointmentHour) + 12 : parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(services, barber, time, total)
      createJob(`0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`, phoneNumber, reminderMessage)
  
    } else {
      sendTextMessage(UserMessage.errorConfirmingAppointment)
    }
  
    // reset user's session
    const session = { 'stepNumber': '2' }

    try {
      await database.updateCustomer(phoneNumber, { session })
    } catch(err){
      next(err)
    }
  }
} 

export class TextWalkInAppointmentInterface extends TextSystem {
  public async textBarberForWalkinAppointment(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const validResponses = barbersInShop.map((time, index) => (index + 1).toString())
    const validatedResponse = validateMessage(userMessage, validResponses)
    const { phoneNumber } = req.customer
    const { services, total } = req.customer.session
    let barberName, session

    if (!validatedResponse) {
      return sendTextMessage(`You must choose a valid response. ${UserMessage.generateChooseBarberMessage()}`)
    }

    barberName = barbersInShop[parseInt(userMessage) - 1]
    const barber = await database.findBarberInDatabase(barberName);
    const firstAvailableTime = getBarberAppointments(services, (barber as BARBER))[0]

    if(!firstAvailableTime){
      session = Object.assign(req.customer.session , { 'stepNumber': '2', appointmentType: null, finishedGeneralSteps: false })
      // the barber is booked for the day
      sendTextMessage('Uh oh! Looks like the barber is booked up for the day. Would you like to try another barber for a walkin or book an appointment? Press: \n(1) for Try another barber \n(2) for Book')
      try {
        await database.updateCustomer(phoneNumber, { session })
      } catch (err) {
        next(err)
      }
      return
    } else {
      const confirmationMessage = UserMessage.generateConfirmationMessage(services, barberName, firstAvailableTime, total)
      session = Object.assign(req.customer.session, { 'stepNumber': '2', time: firstAvailableTime, barber: barberName  })

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
    const { barber, services, total, time} = req.customer.session
    const { firstName, phoneNumber } = req.customer
    let duration = 0;
    services.forEach(service => duration += service.duration)
  
    if (!validatedResponse) return sendTextMessage(UserMessage.errorValidatingConfirmingAppointment)
  
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
        await database.addAppointment(barber, customerInfo.customerData, customerInfo.appointmentData)
      } catch (err) {
        next(err)
      }

      const dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
      const currDate = new Date(dateWithTimeZone)
      const currentTime = parseInt(moment().format('H'))
      let date = currDate.getDate()

      // check if barbershop is closed and move the user to make an appointment for the next day
      if(currentTime > parseInt(barberShopAvailablilty.closed)) date += 1

      const minutes = moment(time, 'YYYY-MM-DD h:mm a').format('m')
      const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
      const alertHour = appointmentHour.includes('pm') ? parseInt(appointmentHour) + 12 : parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(services, barber, time, total)
      createJob(`0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`, phoneNumber, reminderMessage)
    } else {
      sendTextMessage(UserMessage.errorConfirmingAppointment)
    }

    // reset user's session
    const session = { 'stepNumber': '2' }
    try {
      await database.updateCustomer(phoneNumber, { session })
    } catch(err){
      next(err)
    }
  }
}

export class AppSystem {
  public async walkInAppointment(req, res, next) {
    const { barber, name, services } = req.body
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber)
    /* 
        services {
          service, 
          duration,
          price
        }
    */

    const customer = {
        phoneNumber,
        firstName: name
    }
  
    if(!Object.keys(services[0]).length) services.shift()
    
    let total = 0
    services.forEach(service => total += service.price)

    let duration = 0
    services.forEach(service => duration += service.duration)

    const barberInDatabase = await (database.findBarberInDatabase(barber) as any)
    const firstAvailableTime = getBarberAppointments(services, barberInDatabase)[0]

    if(!firstAvailableTime){
      // This barber is booked up for the day
      return res.sendStatus(400)
    }

    const hour24Format = moment(firstAvailableTime, 'hh:mm a').format('HH:mm')
    const confirmationMessage = `${UserMessage.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(service => `\n${service.service}`)}\n\nBarber: ${barber}\nTime: ${firstAvailableTime}\nTotal: $${total}`
    const walkinDate = `${moment().format('YYYY-MM-DD')} ${hour24Format}`

    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: confirmationMessage,
      to: phoneNumber
    })
    
    const time = { from: walkinDate, duration }
    const appointmentData = {
      time,
      services,
      total
    }
    await database.addAppointment(barber, customer, appointmentData)
    const dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    const currDate = new Date(dateWithTimeZone)
    const currentHour = moment().format('H')
    let date = currDate.getDate()

    // check if barbershop is closed and move the user to make an appointment for the next day
    if(parseInt(currentHour) > parseInt(barberShopAvailablilty.closed)) date += 1

    const minutes = moment().format('m')
    const alertHour = currentHour.includes('pm') ? parseInt(currentHour) + 12 : parseInt(currentHour) - 1
    const reminderMessage = UserMessage.generateReminderMessage(services, barber, firstAvailableTime, total)
    createJob(`0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`, phoneNumber, reminderMessage)
  
    res.sendStatus(200)
  }

  public async getBarberAvailableTimes(req, res, next) {
    const { barber, date, services} = req.body
    /* 
        The same flow as the text flow
        res.json with the barbers available times
        format for getBarberAvailableTimes  - 'YYYY-MM-DD hh:mm'
    */
    
    // Format for display 'dddd, MMMM Do, h:mm a'
    // example 
    // getBarberAppointments(req.customer.session.services, barber).map(time => moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))

    const barberInDatabase = await (database.findBarberInDatabase(barber) as Promise<BARBER>)
    const availableTimes = getBarberAppointments(services, barberInDatabase)
    
    res.json({ barber, availableTimes })
  }

  public bookAppointment(req, res, next) {
    const { barberName, datetime, customerName, phoneNumber, services } = req.body
    /*    
        Book an appointment based on date and time

        Send a confirmation text

        Set up the chron job

        Format for storage 'YYYY-MM-DD HH:mm'

        Schema for storage {
          customerData: { phoneNumber, firstName },
          appointmentData: {
            time: { from: time, duration },
            services,
            total
          }
      }
    */

    // getBarberAppointments(req.customer.session.services, barber, '', date).map(time => moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))
    // database.addAppointment(barberName, { customerData }, appointmentData)

    // if(error) res.sendStatus(400)
    res.json({ route: 'book appointment' })
  }
}
