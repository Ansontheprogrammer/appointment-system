import { BARBERSHOP, CUSTOMER } from "../..";
import { phoneNumberFormatter, extractText } from "../../../config/utils";
import { Barbershop } from "../../db/barbershop";
import { Customer } from "../../db/customer";
import {
  cancelRecentAppointment,
  MessagingResponse,
  sendBookLaterDateLink,
  database,
} from "../../twilio";
import { UserMessage } from "../../userMessage";

export class TextInterface {
  public static userInterfaceOptions = {
    bookAppointmentOnline: {
      action: "1",
      name: "Book Appointment Online",
    },
    // bookAppointmentOffline: {
    //     action: '2',
    //     name: 'Book Appointment through text'
    // },
    // bookFirstAvailableAppointment: {
    //     action: '3',
    //     name: 'Book First Available Appointment'
    // },
    // shopHours: {
    //     action: '2',
    //     name: 'Shop Hours'
    // },
    viewAppointment: {
      action: "View",
      name: "View Appointments",
    },
  };

  public sendInterface(res) {
    const sendTextMessage = TextInterface.getMessage(res);
    sendTextMessage(UserMessage.getTextInterfaceMessage(""));
  }

  // For some reason I'm not able to access this method from inside of the user interface method so I will be making this a static method
  public static getMessage(res) {
    return (message) => {
      const msg = new MessagingResponse();
      const messageToSend = msg.message(message);
      return res.send(messageToSend.toString());
    };
  }

  public async userInterface(req, res, next) {
    /* 
      Todo:
        Add a feature that they can press maybe 3 to cancel their most recent appointment maybe no
        If they press four they can cancel a future appointment 
        Add a button to book appointment with first available barber
        Add a button for deals by this barber
    */
    const phoneNumber = phoneNumberFormatter(req.body.From);
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const customerDB = new Customer(["barbershop", barbershop.id, "users"]);
    const userMessage: string = extractText(req.body.Body);
    const sendTextMessage = TextInterface.getMessage(res);
    try {
      const customer = (await customerDB.db.AECollection.findOne(
        "phoneNumber",
        phoneNumber
      )) as CUSTOMER;
      // set req.customer to the customer found in database or an object containing the customer's phone number.
      req.customer = !!customer ? customer : { phoneNumber };
    } catch (err) {
      console.error(err, "Error finding customer");
    }
    if (userMessage === "1") {
      await sendBookLaterDateLink(phoneNumber);
      res.status(200);
      res.end();
    } else if (
      userMessage.toLowerCase() === "view" ||
      userMessage.toLowerCase() === "remove"
    ) {
      await cancelRecentAppointment(req, res);
      res.status(200);
      res.end();
    } else {
      sendTextMessage("Sorry that was an invalid option\n");
    }
  }
}
