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
    private req; 
    private res; 
    private next
    private textTwiml

    constructor(req, res, next){
        this.req = req;
        this.res = res;
        this.next = this.next;
    }

    public sendTextMessage(message: string){
        const msg = new MessagingResponse()
        this.textTwiml = msg.message(message)
        return this.res.send(this.textTwiml.toString())
    }

    public static userInterfaceOptions = {
        bookAppointmentOnline: {
            action: '1',
            name: 'Book Appointment Online'
        },
        bookAppointmentOffline: {
            action: '2',
            name: 'Book Appointment through text'
        },
        bookFirstAvailableAppointment: {
            action: '3',
            name: 'Book First Available Appointment'
        },
        shopHours: {
            action: '4',
            name: 'Shop Hours'
        },
        viewAppointment: {
            action: 'View',
            name: 'View Appointments'
        },
    }

    private sendInterface(res){
        this.sendTextMessage(UserMessage.generateTextInterfaceMessage());
    }

    private invalidInterfaceOption(res){
       this.sendTextMessage('Sorry that was an invalid option\n')
       this.sendInterface(res);
    }


    public async userInterface() {
        /* Todo:
            Add a feature that they can press maybe 3 to cancel their most recent appointment
            If they press four they can cancel a future appointment 
         */
        const userMessage: string = extractText(this.req.body.Body);
        const phoneNumber = phoneNumberFormatter(this.req.body.From)
        try {
            let customer = await database.findCustomerInDatabase(phoneNumber)
            // set req.customer to the customer found in database or an object containing the customer's phone number. 
            this.req.customer = !!customer ? customer : { phoneNumber }
        } catch(err) {
            console.error(err, 'Error finding customer');
        }
        switch (userMessage) {
            case '1':
                return sendBookLaterDateLink(phoneNumber)
            case '4': 
                return this.sendTextMessage('')
            case 'view':
                return cancelRecentAppointment(this.req, this.res)
            default:
                return this.invalidInterfaceOption(this.res)

        }
    }
}