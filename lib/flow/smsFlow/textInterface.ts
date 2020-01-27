import { 
  phoneNumberFormatter, extractText,
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
        bookAppointmentOnline: {
            action: '1',
            name: 'Book Appointment Online'
        },
        // bookAppointmentOffline: {
        //     action: '2',
        //     name: 'Book Appointment through'
        // },
        // shopHours: {
        //     action: '5',
        //     name: 'Shop Hours'
        // },
        cancelAppointment: {
            action: 'View',
            name: 'View Appointments'
        },
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
        const userMessage: string = extractText(req.body.Body);
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
            return sendBookLaterDateLink(phoneNumber)
        } else if(userMessage.toLowerCase() === 'view'){
            return cancelRecentAppointment(req, res);
        } else {
            return TextInterface.invalidInterfaceOption(res)
        }
    }
}