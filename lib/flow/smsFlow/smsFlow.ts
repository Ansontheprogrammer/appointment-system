import { 
  phoneNumberFormatter, 
  extractText, 
  validateMessage, 
  extractNumbers,
  shopIsClosed,
} from '../../../config/utils'
import { 
  database, 
  UserMessage, 
  sendshopIsClosedMessage, 
  sendBookLaterDateLink,
  MessagingResponse,
} from '../../twilio'
import { serviceList, friendlyShopName } from '../../database'

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
  
      extractNumbers(userMessage).forEach(n => {
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