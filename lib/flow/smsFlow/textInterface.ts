import { 
    extractNumberFromMessage, phoneNumberFormatter,
} from '../../../config/utils'
import { 
    cancelRecentAppointment, 
    MessagingResponse,
    sendBookLaterDateLink,
    UserMessage,
} from '../../twilio'

export class TextInterface {
    private sendTextMessage(res: any, message) {
        const msg = new MessagingResponse()
        msg.message(message)
        res.writeHead(200, { 'Content-Type': 'text/xml' })
        return res.send(msg.toString())
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
        }
    }

    public sendInterface(res){
        this.sendTextMessage(res, UserMessage.generateTextInterfaceMessage());
    }

    private invalidInterfaceOption(res){
       this.sendTextMessage(res, 'Sorry that was an invalid option\n')
       this.sendInterface(res);
    }

    public userInterface(req, res, next) {
        const userMessage: string = extractNumberFromMessage(req.body.Body);
        const phoneNumber = phoneNumberFormatter(req.body.From)

        switch (userMessage){
            case TextInterface.userInterfaceOptions.cancelAppointment.number:
                cancelRecentAppointment(req, res);
            case TextInterface.userInterfaceOptions.bookAppointmentOnline.number:
                sendBookLaterDateLink(phoneNumber)
            case TextInterface.userInterfaceOptions.bookAppointmentOffline.number:
                // Add customer field allowing us to make the text message flow active or not.
                this.sendTextMessage(res, 'Sorry this shop does not provide offline booking')
            case TextInterface.userInterfaceOptions.help.number:
                this.sendInterface(res)
            default:
                this.invalidInterfaceOption(res)
        }

        res.sendStatus(200);
    }
}