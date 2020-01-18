import { 
  phoneNumberFormatter, 
  extractText, 
  validateMessage, 
  extractedNumbers,
  shopIsClosed,
  getDate
} from '../../config/utils'
import { 
  database, 
  getBarberAppointments, 
  UserMessage, 
  sendshopIsClosedMessage, 
  cancelRecentAppointment, 
  sendBookLaterDateLink,
  MessagingResponse,
  client,
} from '../twilio'
import { barbersInShop, serviceList, friendlyShopName, twilioPhoneNumber } from '../database'
import moment from 'moment';
import { BARBER } from '../'
import { createJob } from '../cron'

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
      
      try {
        let customer = await database.findCustomerInDatabase(phoneNumber)
        // set req.customer to the customer found in database or an object containing the customer's phone number. 
        req.customer = !!customer ? customer : { phoneNumber }
        const userMessage: string = extractText(req.body.Body)
        const constructionMessage = "App under construction";
        client.messages.create({
          from: twilioPhoneNumber,
          body: constructionMessage,
          to: req.customer.phoneNumber
        })
        return 
        // Handle if the user would like to cancel the most recent appointment
        if (userMessage.toLowerCase() === 'remove') {
          // set customer info to just contain phone number
          return cancelRecentAppointment(req, res)
        } 
        // Send user a message if they would like to continue in the flow and the shop is closed
        if (shopIsClosed()) return sendshopIsClosedMessage(phoneNumber, res)
        if (!customer) {
          const sendTextMessage = TextSystem.getTextMessageTwiml(res)
          sendTextMessage(
            `${UserMessage.generateRandomGreeting()}, this is ${friendlyShopName} appointment system. I'm going to help book your appointment today. Can you please tell me your name?`
          )
          customer = await database.createCustomer(phoneNumber)
          return
        } else {
          // Handle if the user would like to reset the flow
          if (userMessage.toLowerCase() === 'reset') {
            const sendTextMessage = TextSystem.getTextMessageTwiml(res)
            return TextSystem.resetUser(req.customer.phoneNumber, sendTextMessage)
          }
                    
          // Send user to the next step
          next()
        }
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
        if(!req.customer.firstName){
          await database.updateCustomer(req.customer.phoneNumber, propsToUpdateUser)
        }
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
      let services = [], total = 0
  
      extractedNumbers(userMessage).forEach(n => {
        // if service is invalid skip this service
        if(!serviceList[n]) return 
        const service = serviceList[n].service
        const price = serviceList[n].price
        const duration = serviceList[n].duration
  
        services.push({ service, duration })
        total += price
      })

      if(!services){
        return sendTextMessage(
          `You must choose one of the following. \n\n${UserMessage.generateAvailableServicesMessage()}`
        )
      }
  
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
        const currDate = getDate()
        let date = currDate.date()
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
          `0 ${minutes} ${alertHour} ${date} ${currDate.month()} *`,
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
  
        const currDate = getDate()
        let date = currDate.date()
  
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
          `0 ${minutes} ${alertHour} ${date} ${currDate.month()} *`,
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