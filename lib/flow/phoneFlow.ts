import { 
  phoneNumberFormatter, 
  shopIsClosed, 
  } from '../../config/utils'
import { 
  database, 
  sendBookLaterDateLink,
  VoiceResponse,
  sendText,
  UserMessages,
} from '../twilio'

import { 
  friendlyShopName, 
  automatedVoice,
  barberShopPhoneNumber
} from '../database'
import { TextInterface } from './smsFlow/textInterface'

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
  public static callBarbershop(res, twiml) {
    console.log('in call barbershop')
    let phoneNumber;
    if(process.env.NODE_ENV === 'development'){
      phoneNumber = '9082097544'
    } else {
      phoneNumber = barberShopPhoneNumber
    }
    twiml.dial(phoneNumber)
    res.send(twiml.toString())
  }

  public static sayMessageToClient(res, twiml, message){
    twiml.say(message, { voice: automatedVoice })
    // res.send(twiml.toString())
  }

    public async phoneFlow(req, res, next) {
      const phoneNumber = phoneNumberFormatter(res.req.body.From)
      const twiml = new VoiceResponse()
      const connectToShopMessage = `Thank you for calling ${friendlyShopName}!. I'm connecting you to the shop right now. One moment please`;
      const tellCustomerAboutTextInterfaceMessage = "\nAlso I'm sending you a text message to show you our text interface. This will allow for you to book an appointment, know shop available, and a bunch of other useful stuff about the shop";
      const shopIsClosedMessage = `The shop is closed currently. I'm sending you a link to book an appointment at a later date`;
      let message
      /*
          if shop is closed currently send shop is closed message
          sending twiml before creating gather twiml to avoid latency issues
      */
      if (shopIsClosed()) {
        PhoneSystem.sayMessageToClient(res, twiml, shopIsClosedMessage);
        sendBookLaterDateLink(phoneNumber)
        return
      }

      message += connectToShopMessage;
      // TODO: Play caller a song or waiting sound while we connect them to the shop
      PhoneSystem.sayMessageToClient(res, twiml, connectToShopMessage)

      try {
        // Check to see if the customer is currently in database before telling them about text interface
        const customer = await database.findCustomerInDatabase(phoneNumber)
        if (!customer) {
          PhoneSystem.sayMessageToClient(res, twiml, tellCustomerAboutTextInterfaceMessage)
          sendText(new UserMessages().getTextInterfaceMessage(), phoneNumber)
          await database.createCustomer(phoneNumber)
        }
      } catch(err){
        console.error(err)
      }

      PhoneSystem.callBarbershop(res, twiml)
      res.status(200)
    }
}