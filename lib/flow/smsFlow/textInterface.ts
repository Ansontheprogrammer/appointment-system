import { 
  phoneNumberFormatter, extractText,
} from '../../../config/utils'
import { 
    cancelRecentAppointment, 
    MessagingResponse,
    sendBookLaterDateLink,
    database,
    UserMessages,
} from '../../twilio'

export class TextInterface {
    public static userInterfaceOptions = {
        bookAppointmentOnline: {
            action: '1',
            name: 'Book Appointment Online'
        },
        // bookAppointmentOffline: {
        //     action: '2',
        //     name: 'Book Appointment through text'
        // },
        // bookFirstAvailableAppointment: {
        //     action: '3',
        //     name: 'Book First Available Appointment'
        // },
        shopHours: {
            action: '2',
            name: 'Shop Hours'
        },
        viewAppointment: {
            action: 'View',
            name: 'View Appointments'
        },
    }

    public sendInterface(res){
        const sendTextMessage = TextInterface.getMessage(res)
        sendTextMessage(new UserMessages().getTextInterfaceMessage());
    }

    private invalidInterfaceOption(res){
        const sendTextMessage = TextInterface.getMessage(res)
        sendTextMessage('Sorry that was an invalid option\n');
        this.sendInterface(res);
    }

    // For some reason I'm not able to access this method from inside of the user interface method so I will be making this a static method
    public static getMessage(res){
        return message => {
            const msg = new MessagingResponse()
            const messageToSend = msg.message(message)
            return res.send(messageToSend.toString())
        }
    }

    public async userInterface(req, res, next) {
        /* Todo:
            Add a feature that they can press maybe 3 to cancel their most recent appointment maybe no
            If they press four they can cancel a future appointment 
            Add a button to book appointment with first available barber
            Add a button for deals by this barber
         */
        const userMessage: string = extractText(req.body.Body);
        const phoneNumber = phoneNumberFormatter(req.body.From)
        const sendTextMessage = TextInterface.getMessage(res)
        try {
            let customer = await database.findCustomerInDatabase(phoneNumber)
            // set req.customer to the customer found in database or an object containing the customer's phone number. 
            req.customer = !!customer ? customer : { phoneNumber }
        } catch(err) {
            console.error(err, 'Error finding customer');
        }
        if(userMessage === '1'){
            sendBookLaterDateLink(phoneNumber)
            .then(() => {
                res.status(200)
                res.end()
            })
        } else if(userMessage === '2'){
            sendTextMessage(new UserMessages().getShopHoursMessage())
        } else if(userMessage.toLowerCase() === 'review'){
            cancelRecentAppointment(req, res)
        } else {
            this.invalidInterfaceOption(res)
        }
    }
}