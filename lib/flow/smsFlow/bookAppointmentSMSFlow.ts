import { 
    extractText, 
    validateMessage, 
    getDate
  } from '../../../config/utils'
  import { 
    database, 
    getBarberAppointments, 
    UserMessage, 
  } from '../../twilio'
  import { barbersInShop } from '../../database'
  import moment from 'moment';
  import { BARBER } from '../..'
  import { createJob } from '../../cron'
import { TextSystem } from './smsFlow';

export class TextBookAppointmentInterface {
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