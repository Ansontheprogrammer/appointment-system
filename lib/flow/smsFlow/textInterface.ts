import { 
    extractNumberFromMessage, phoneNumberFormatter,
} from '../../../config/utils'
import { 
    cancelRecentAppointment, 
    MessagingResponse,
    sendBookLaterDateLink,
    UserMessage,
    database,
} from '../../twilio'

export class TextInterface {
    public static getTextMessageTwiml(res: any) {
        return message => {
            const msg = new MessagingResponse()
            msg.message(message)
            return res.send(msg.toString())
        }
    }

    public static userInterfaceOptions = {
        cancelAppointment: {
            number: '1',
            name: 'Cancel Appointment'
        },
        bookAppointmentOnline: {
            number: '2',
            name: 'Book Appointment Online'
        },
        bookAppointmentOffline: {
            number: '3',
            name: 'Book Appointment Offline'
        },
        help: {
            number: '4',
            name: 'Help'
        },
        shopHours: {
            number: '5',
            name: 'Shop Hours'
        }
    }

    public static sendInterface(res){
        const sendTextMessage = TextInterface.getTextMessageTwiml(res)
        sendTextMessage(UserMessage.generateTextInterfaceMessage());
    }

    public static invalidInterfaceOption(res){
       const sendTextMessage = TextInterface.getTextMessageTwiml(res)
       sendTextMessage('Sorry that was an invalid option\n')
       TextInterface.sendInterface(res);
    }

    public async userInterface(req, res, next) {
        /* Todo:
            Add a feature that they can press maybe 3 to cancel their most recent appointment
            If they press four they can cancel a future appointment 
         */
        const userMessage: string = extractNumberFromMessage(req.body.Body);
        const phoneNumber = phoneNumberFormatter(req.body.From)
        const sendTextMessage = TextInterface.getTextMessageTwiml(res);
        try {
            let customer = await database.findCustomerInDatabase(phoneNumber)
            // set req.customer to the customer found in database or an object containing the customer's phone number. 
            req.customer = !!customer ? customer : { phoneNumber }
        } catch(err) {
            console.error(err, 'Error finding customer');
        }
        if(userMessage === '1'){
            cancelRecentAppointment(req, res);
        } else if(userMessage === '2'){
            sendBookLaterDateLink(phoneNumber)
        } else if(userMessage === '3'){
            // Add customer field allowing us to make the text message flow active or not.
            sendTextMessage('Sorry this shop does not provide offline booking')
        } else if(userMessage === '4'){
            TextInterface.sendInterface(res)
        } else if(userMessage === '5'){
            sendTextMessage(UserMessage.generateShopOpenAvailabilityMessage)
        }  else {
            TextInterface.invalidInterfaceOption(res)
        }
    }
}