import { 
    extractText, 
    validateMessage, 
    getDate
  } from '../../../config/utils'
  import { 
    database,  
    UserMessages, 
  } from '../../twilio'
  import { barbersInShop, getBarberAppointments} from '../../database'
  import moment from 'moment';
  import { BARBER } from '../..'
  import { createJob } from '../../cron'
import { TextSystem } from './smsFlow';
  
const UserMessage = new UserMessages()

export class TextWalkInAppointmentInterface  {
    /*
      TODO: 
        Update flow to allow clients to make the first available appointment with any barber
        Make this feature only available for shops
    */ 
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
          `You must choose a valid response. ${UserMessage.getChooseBarberMessage()}`
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
        const confirmationMessage = UserMessage.getConfirmationMessage(
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
        const reminderMessage = UserMessage.getReminderMessage(
          services,
          barber,
          time,
          total
        )
        // createJob(
        //   `0 ${minutes} ${alertHour} ${date} ${currDate.month()} *`,
        //   phoneNumber,
        //   reminderMessage,
        //   barber
        // )
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