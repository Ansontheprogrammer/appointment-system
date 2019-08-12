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

const barbersInShop = ['Kelly', 'Anson', 'Idris'];
const timeBarbershopOpens = '10'
const timeBarbershopCloses = '19'
const barberShopAvailablilty = {
  daysClosed: {
    // formatted for datetime object
    'Monday': {
      index: 1,
      nextAvailableDay: 2
    },
    'Sunday': {
      index: 0,
      nextAvailableDay: 3
    },

  },
  openTime: '10',
  closeTime: '19'
}
export function phoneNumberFormatter(phoneNumber: string) {
    if (phoneNumber[0] === '+') return phoneNumber.slice(2)
    if (phoneNumber[0] === '1') return phoneNumber.slice(1)
    return phoneNumber
  }

export function extractText(body: string): string {
  return String(body.match(/\w+/gi))
}

export function getAvailableTimes(duration: number, interval: number, allocatedTimes: ALLOCATED_TIMES[], from: string, to: string, appoximateTime?: string): TimeAvailability[] {
    // set time to get available times through
    let fromTime;
    let toTime;
  
    if(!!appoximateTime) {
      fromTime = appoximateTime
      toTime = (parseInt(appoximateTime) + 1).toString()
    }
    else {
      fromTime = barberShopAvailablilty.openTime;
      toTime = barberShopAvailablilty.closeTime
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
            { from: `${from} 13:00`, to: `${from} 14:00` }
          ],
          allocated: allocatedTimes
        }
      ]
    })[from]
  }

export function getBarberAppointments(services: SERVICES[], barber: BARBER, approximate?: boolean, approximateTime?: string): string[] {
    const currentDateAndTime = moment()
    const currentTime = parseInt(currentDateAndTime.format('H'))
    let from = currentDateAndTime.format('YYYY-MM-DD')
    const currentDayOfTheWeek = new Date().getDay()
    // check if barbershop is closed and move the user to make an appointment for the next day
    if(currentTime > parseInt(timeBarbershopCloses)){
      if(currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Monday.index || currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Sunday.index){
        if(currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Monday.index) from = moment(from).add(barberShopAvailablilty.daysClosed.Monday.nextAvailableDay, 'day').format('YYYY-MM-DD')  
        else if(currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Sunday.index) from = moment(from).add(barberShopAvailablilty.daysClosed.Sunday.nextAvailableDay, 'day').format('YYYY-MM-DD') 
      }
      else from = moment(from).add(1, 'day').format('YYYY-MM-DD')  
    }
    let to = moment(from).add(1, 'day').format('YYYY-MM-DD')
    const barbersAllocatedTimes = barber.appointments.map(appointment => appointment.details.time)
    let totalDuration = 0;
    // sum up total durations
    services.forEach(service => totalDuration += service.duration)

    let availableTimes
    if(!!approximateTime){
      availableTimes = getAvailableTimes(totalDuration, 15, barbersAllocatedTimes, from, to, approximateTime)
    } else {
      availableTimes = getAvailableTimes(totalDuration, 15, barbersAllocatedTimes, from, to)
    }
    
    if (approximate) return getApproximateTimes(availableTimes).map(time => moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm'))
    else return getExactTimes(availableTimes).map(time => moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm'))
  }
  
export function getApproximateTimes(barbersAllocatedTimes: TimeAvailability[]) {
    return barbersAllocatedTimes
      .filter(availability => availability.available)
      .map(availability => moment(availability.time, 'HH:mm').format('hh:mm a').slice(0, 2))
      .map(availability => {
        if (availability.slice(0, 1) === '0') return availability.slice(1).concat(':00 ' + 'pm')
        if (availability === '12') return availability.concat(':00 ' + 'pm')
        else return availability.concat(':00 ' + 'am')
      })
      .filter((availability, index, self) => self.indexOf(availability) === index)
  }
  
export function getExactTimes(barbersAllocatedTimes: any) {
    return barbersAllocatedTimes
      .filter(availability => availability.available)
      .map(availability => {
        let timeAvailableByHour = moment(availability.time, 'HH:mm').format('h')
        let timeAvailable;
        // convert am -> pm
        if(timeAvailableByHour.length == 1 && parseInt(timeAvailableByHour) <= parseInt(timeBarbershopCloses)){
          timeAvailable = moment(availability.time, 'HH:mm').format('h:mm a')
          timeAvailable = timeAvailable.slice(0, timeAvailable.length - 3)
          timeAvailable = timeAvailable.concat(' pm')
        } else {
          timeAvailable = moment(availability.time, 'HH:mm').format('h:mm a')
        }
     
        return timeAvailable
      })
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


class UserMessageInterface {
  introWords = ['Great', 'Thanks', 'Fantastic', "Awesome", 'Amazing', 'Sweet', 'Okay', 'Phenominal'];
  introGreetingWords = ["How you doing", "How you been", 'Long time no see']
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nAlso if you would like any grapic designs or hair drawings today for $5+\nText: (Extra)\n\nIf you would like to cancel \nText: (Cancel) \n\nTo book another appointment \nPress:\n (1) for walkin \n(2) to book an appointment`;
  chooseAppointmentTypeMessage = `Is this for a walkin or to book an appointment? \nPress: \n(1) for Walkin\n(2) for Book`;
  friendlyFormat = 'dddd, MMMM Do, h:mm a'

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
    return `Here are their available times\nPress:${barberSchedule.map((slot, i) => `\n(${i + 1}) for ${slot}`)}`
  }

  public generateErrorValidatingAppointmentTime(barberSchedule: string[]){
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map((slot, i) => `\n(${i + 1}) for ${slot}`)}`
  }
  
  public generateChooseBarberMessage(){
    return `Which barber would you like today? Press: \n${barbersInShop.map((barber, index) =>  `\n(${index + 1}) for ${barber}`)}`
  }
  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart`
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

  private callBarbershop(res) {
    const twiml = new VoiceResponse()
    twiml.say(`${this.generateRandomAgreeWord()}! I'm connecting you to the shop right now.`, {
      voice: 'Polly.Salli'
    })
    twiml.dial(config.BARBERSHOP_PHONE_NUMBER)
    res.set('Content-Type', 'text/xml')
    return res.send(twiml.toString())
  }

  public async chooseService(req, res, next) {
    const keyPress = res.req.body.Digits
    const twiml = new VoiceResponse()
    const gather = twiml.gather({
      action: '/api/chosenBarber',
      method: 'POST',
      numDigits: 1,
      timeout: 7
    })
  
    // Handle if we have a redirect, we want to check if key press is truthy first
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res)
  
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
  
        services.push(service)
        total += price
      })
  
      try {
        await database.updateCustomer(
          phoneNumberFormatter(req.body.From),
          { service: services, total }
        )
        gather.say(
          `${this.generateRandomAgreeWord()}! So you would like a ${services} and your current total is $${total}. ${this.generateChooseBarberMessage()}`,
          { voice: 'Polly.Salli' }
        )
        return res.send(twiml.toString())
      } catch (err) {
        next(err)
      }
    } else {
      gather.say(
        this.generateChooseBarberMessage(),
        { voice: 'Polly.Salli' }
      )
      return res.send(twiml.toString())
    }
  }

  public async chosenBarber(req, res, next) {
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
  
    if (!!keyPress) if (!validatedResponse) return this.errorMessage(res, '/api/chooseService')
  
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res)
  
    // set barber name if this is a redirect
    if (keyPress === undefined) {
      const customer = await new Database().findCustomerInDatabase(phoneNumber)
      barberName = customer.barber
    } else {
      barberName = barbersInShop[parseInt(keyPress) - 1]
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
        `${this.generateRandomAgreeWord()}! ${barberName} will be excited. Time to book your appointment. Here is ${barberName}'s current schedule for today. Press:${availableTimes.map((time, index) => `\n(${index + 1}) for ${time}`)}`,
        { voice: 'Polly.Salli' }
      )
      await database.updateCustomer(
        phoneNumber,
        { barber: barberName }
      )
    }
    return res.send(twiml.toString())
  }

  public async confirmation(req, res, next) {
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
    if (!!keyPress) if (keyPress[0] === '0') return this.callBarbershop(res)
  
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
  
    if (time === undefined) return this.errorMessage(res, '/api/chosenBarber')
  
    twiml.say(
      `${this.generateRandomAgreeWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today. Goodbye`,
      { voice: 'Polly.Salli' }
    )
    res.send(twiml.toString())
  
    try {
      await database.addAppointment(barber, { phoneNumber, firstName }, time)
  
      let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
      let currDate = new Date(dateWithTimeZone)
      const minutes = currDate.getMinutes()
  
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
        `${this.generateRandomAgreeWord()}! So to confirm \nYou've just made an appointment\nService: ${services.map(service => `\n${service}`)}\n\nBarber: ${barber}\nTime: ${time}\nTotal: $${total}`,
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
          `${UserMessage.generateRandomGreeting()}, this is Barber Sharp appointment system. I'm going to help book your appointment today. Can you please tell me your name?`
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
      if (userMessage.toLowerCase() === 'cancel') {
        const sendTextMessage = TextSystem.getTextMessageTwiml(res)
      }

      // Handle if the user would like to add additional services 
      if (userMessage.toLowerCase() === 'extra') {
        const session = Object.assign(req.customer.session, { additionalServices: true, stepNumber: '1' })

        try {
          await database.updateCustomer(phoneNumber, { session })
        } catch (err) {
          next(err)
        }
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

    const barberSchedule = getBarberAppointments(req.customer.session.services, barber, true)
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
  
  
  public async textChoseExactTime(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    const { services, barber, total } = req.customer.session
    const barberInDatabase = await (database.findBarberInDatabase(barber) as Promise<BARBER>)
    const barberSchedule = getBarberAppointments(services, barberInDatabase, true)
    const validResponses = barberSchedule.map((time, index) => (index + 1).toString())
    const validatedResponse = validateMessage(userMessage, validResponses)
    let session
    if (!validatedResponse) return sendTextMessage(UserMessage.generateErrorValidatingAppointmentTime(barberSchedule))
  
    const approximateTime = barberSchedule[parseInt(userMessage) - 1]
    const exactTimes = getBarberAppointments(services, barberInDatabase, false, approximateTime)
    // If there is no exact times skip user to confirmation message
    if (exactTimes.length > 1) {  
      session = Object.assign(req.customer.session , { stepNumber: '3', approximateTime })
      const propsToUpdateUser = { session }

      sendTextMessage(`Awesome! so which time would you like exactly. ${UserMessage.generateGetBarberAvailableTimesMessage(exactTimes)}`)
      try {
        await database.updateCustomer(req.customer.phoneNumber, propsToUpdateUser)
      } catch(err){
        next(err)
      } 
    } else {
      try {
        sendTextMessage( UserMessage.generateConfirmationMessage(services, barber, approximateTime, total) )
        session = Object.assign(req.customer.session , { stepNumber: '4', time: approximateTime })
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } catch (err) {
        next(err)
      }
    }
  }
  
  public async textConfirmAppointmentTime(req, res, next) {
    const { barber, services, total, approximateTime } = req.customer.session
    const userMessage: string = extractText(req.body.Body)
    const barberInDatabase = await (database.findBarberInDatabase(barber) as Promise<BARBER>)
    const barberSchedule = getBarberAppointments(services, barberInDatabase, false, approximateTime)
    const validResponses = barberSchedule.map((time, index) => (index + 1).toString())
    const validatedResponse = validateMessage(userMessage, validResponses)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
  
    if (userMessage.toLowerCase() === 'reset') return TextSystem.resetUser(req.customer.phoneNumber, sendTextMessage)
  
    if (!validatedResponse) return sendTextMessage(UserMessage.generateErrorValidatingAppointmentTime(barberSchedule))
    
    const exactTime = barberSchedule[parseInt(userMessage) - 1]
    const timeForConfirmationMessage = moment(exactTime, 'YYYY-MM-DD HH:mm').format('h:mm a')
    const confirmationMessage = UserMessage.generateConfirmationMessage(services, barber, timeForConfirmationMessage, total)
    sendTextMessage(confirmationMessage)
    const session = Object.assign(req.customer.session , { stepNumber: '4', time: exactTime })

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
      if(currentTime > parseInt(timeBarbershopCloses)) date += 1
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
    const firstAvailableTime = getBarberAppointments(services, (barber as BARBER), false)[0]

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
      session = Object.assign(req.customer.session ,{ 'stepNumber': '2', time: firstAvailableTime, barber: barberName  })

      sendTextMessage(confirmationMessage)
      console.log(session, 'session')
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
      if(currentTime > parseInt(timeBarbershopCloses)) date += 1

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

export class TextAdditionalServicesInterface {
  public async textStartAdditionalService(req, res, next) {
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    let barbers
    /*
      Check to see if the user has multiple appointments in database 
      Allow them to choose which one
      Ask based on how many services to add additional services too?
    */
    try {
      barbers = await database.findAllBarbers()

    const userAppointmentsInSystems = barbers.flatMap(barber => {
      return barber.appointments.filter(appointments => appointments.phoneNumber === req.customer.phoneNumber)
    })

    const currentFormattedAppointments = userAppointmentsInSystems.map(appointment => moment(appointment.details.time.from, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))
    if(currentFormattedAppointments.length === 0) {
      sendTextMessage(`You don't have any appointments currently, Would you like to book an appointment? \nText: \n1 for walkin\n2 for to book an appointment`)
      const session = { additionalServices: false, stepNumber: '1' }
      await database.updateCustomer(req.customer.phoneNumber, { session })
    } else {
      const services = userAppointmentsInSystems[userAppointmentsInSystems.length - 1].details.services.map(service => service.service)
      const session = { additionalServices: true, stepNumber: '2' }
      sendTextMessage(`Which service would you like to add additional services too? ${services.map((service, index) => `\n(${index}) ${service}`)}`)
      await database.updateCustomer(req.customer.phoneNumber, { session })
    } 
  } catch (err){
      next(err)
    }
  }

  public async textConfirmAdditionalService(req, res, next) {
    const userMessage: string = extractText(req.body.Body)
    const sendTextMessage = TextSystem.getTextMessageTwiml(res)
    let barbers
    try {
      barbers = await database.findAllBarbers()

      const userAppointmentsInSystems = barbers
      .flatMap(barber => barber.appointments.filter(appointments => appointments.phoneNumber === req.customer.phoneNumber))
      .map(appointment => appointment.details.services)

      const currentFormattedAppointments = userAppointmentsInSystems.map(appointment => moment(appointment.details.time.from, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat))
      if(currentFormattedAppointments.length === 0) {
        sendTextMessage(`You don't have any appointments currently, Would you like to book an appointment? \nText: \n1 for walkin\n2 for to book an appointment`)
        const session = { additionalServices: false, stepNumber: '1' }
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } else {
        const services = userAppointmentsInSystems[userAppointmentsInSystems.length - 1].details.services
        const session = { additionalServices: true, stepNumber: '2' }
        sendTextMessage(`Which service would you like to add additional services too? ${services.map((service, index) => `\n(${index}) ${service.service}`)}`)
        await database.updateCustomer(req.customer.phoneNumber, { session })
      } 
      const session = { additionalServices: false, stepNumber: '1' }
      await database.updateCustomer(req.customer.phoneNumber, { session })
  } catch (err){
      next(err)
    }
  }
}


export class AppSystem {
  public bookAppointment(req, res, next) {
    const { barberName, datetime, customerName, phoneNumber, services } = req
    /*    
        Book an appointment based on date and time
        Send a confirmation text
        Set up the chron job
    */

    res.json({ route: 'book appointment' })
  }

  public async walkInAppointment(req, res, next) {
    const { barber, name, services } = req.body
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber)
    /* 
        Get current date time
        Book an appointment based on current date and time
        Send a confirmation text
        Set up the chron job
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
    const firstAvailableTime = getBarberAppointments(services, barberInDatabase, false)[0]
    if(!firstAvailableTime){
      // This barber is booked up for the day
      return res.sendStatus(400)
    }
    const hour24Format = moment(firstAvailableTime, 'hh:mm a').format('HH:mm')
    const hour12Format = moment(firstAvailableTime, 'hh:mm a').format('hh:mm a')
    const confirmationMessage = `Awesome! Here are your appointment details:\n\nService: ${services.map(service => `\n${service.service}`)}\n\nBarber: ${barber}\nTime: ${hour12Format}\nTotal: $${total}`
    const walkinDate = `${moment().format('YYYY-MM-DD')} ${hour24Format}`

    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body: confirmationMessage,
      to: phoneNumber
    })
    
    const time = { from: walkinDate, duration }
    await database.addAppointment(barber, customer, { time })
    const dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    const currDate = new Date(dateWithTimeZone)
    const currentHour = moment().format('H')
    let date = currDate.getDate()

    // check if barbershop is closed and move the user to make an appointment for the next day
    if(parseInt(currentHour) > parseInt(timeBarbershopCloses)) date += 1

    const minutes = moment().format('m')
    const alertHour = currentHour.includes('pm') ? parseInt(currentHour) + 12 : parseInt(currentHour) - 1
    const reminderMessage = UserMessage.generateReminderMessage(services, barber, hour12Format, total)
    createJob(`0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`, phoneNumber, reminderMessage)
  
    res.sendStatus(200)
  }

  public async getBarberAvailableTimes(req, res, next) {
    const { barber, datetime, services} = req.body
    /* 
        The same flow as the text flow
        res.json with the barbers available times
        format for getBarberAvailableTimes  - 'YYYY-MM-DD hh:mm'
    */
    
    const barberInDatabase = await (database.findBarberInDatabase(barber) as any)
    const availableTimes = getBarberAppointments(services, barberInDatabase, false)
    
    res.json({ barber, availableTimes })
  }
}
