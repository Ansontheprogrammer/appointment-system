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
    private getTextMessageTwiml(res: any) {
      return (message: string) => {
        const msg = new MessagingResponse()
        msg.message(message)
        res.writeHead(200, { 'Content-Type': 'text/xml' })
        return res.end(msg.toString())
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
        }
    }

    public sendInterface(res){
        const sendTextMessage = this.getTextMessageTwiml(res);
        sendTextMessage(UserMessage.generateTextInterfaceMessage())
    }

    public userInterface(req, res, next) {
        const userMessage: string = extractNumberFromMessage(req.body.Body);
        const phoneNumber = phoneNumberFormatter(req.body.From)

        switch (userMessage){
            case TextInterface.userInterfaceOptions.cancelAppointment.number:
                return cancelRecentAppointment(req, res);
            case TextInterface.userInterfaceOptions.bookAppointmentOnline.number:
                return sendBookLaterDateLink(phoneNumber)
            case TextInterface.userInterfaceOptions.bookAppointmentOffline.number:
                // Add customer field allowing us to make the text message flow active or not.
                return
            case TextInterface.userInterfaceOptions.help.number:
                return this.sendInterface(res)
        }
    }
}