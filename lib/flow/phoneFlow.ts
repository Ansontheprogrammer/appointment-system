import { 
  phoneNumberFormatter, 
  shopIsClosed, 
  } from '../../config/utils'
import { 
  database, 
  sendBookLaterDateLink,
  VoiceResponse,
} from '../twilio'

import { 
  friendlyShopName, 
  automatedVoice,
  barberShopPhoneNumber
} from '../database'

/*
  TODO ^Feature: 
    Create a feature if the shop is busy so that we tell the client when they call the shop they can't take any calls at the moment.
    Also we should make a list of all the customers that call so the barbers can see after the shop isn't so busy
*/
/*
  TODO ^Feature: 
    Allow shops to create custom promo messages that their clients have to hear before they call
*/

export class PhoneSystem {
    public async phoneFlow(req, res, next) {
      const phoneNumber = phoneNumberFormatter(res.req.body.From)
      const twiml = new VoiceResponse()
      const connectToShopMessage = `Thank you for calling ${friendlyShopName}!. I'm connecting you to the shop right now. One moment please`;
      const tellCustomerAboutTextInterfaceMessage = "Also I'm sending you a text message to show you our text interface. This will allow for you to book an appointment, know shop available, and a bunch of other useful stuff about the shop";
      const shopIsClosedMessage = `The shop is closed currently. I'm sending you a link to book an appointment at a later date`;
      /*
          if shop is closed currently send shop is closed message
          sending twiml before creating gather twiml to avoid latency issues
      */
      if (shopIsClosed()) {
        this.sayMessageToClient(res, twiml, shopIsClosedMessage);
        sendBookLaterDateLink(phoneNumber)
        return
      }

      // TODO: Play caller a song or waiting sound while we connect them to the shop
      this.sayMessageToClient(res, twiml, connectToShopMessage)

      try {
        // Check to see if the customer is currently in database before telling them about text interface
        const customer = await database.findCustomerInDatabase(phoneNumber)

        if (!customer) {
          this.sayMessageToClient(res, twiml, tellCustomerAboutTextInterfaceMessage)
          await database.createCustomer(phoneNumber)
        }
      } catch(err){
        console.error(err)
      }

      this.callBarbershop(res, twiml)
      // Send them text interface
    }
  
    private callBarbershop(res, twiml) {
      twiml.dial(barberShopPhoneNumber)
      res.send(twiml.toString())
    }

    private sayMessageToClient(res, twiml, message){
      twiml.say(message, { voice: automatedVoice })
      res.send(twiml.toString())
    }
}