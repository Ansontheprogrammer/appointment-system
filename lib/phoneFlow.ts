import { 
  VoiceResponse,
} from './twilio'
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
  public static callBarbershop(req, res, twiml) {
    let phoneNumber = process.env.NODE_ENV === 'development' ? '9082097544' : req.barberShopInfo.shopPhoneNumber
    twiml.dial(phoneNumber)
    return res.send(twiml.toString())
  }

  public static sayMessageToClient(req, res, twiml, message){
    twiml.say(message, { voice: req.barberShopInfo.phoneVoice })
    return res.send(twiml.toString())
  }

    public async phoneFlow(req, res, next) {
      const twiml = new VoiceResponse()
      const connectToShopMessage = `Thank you for calling ${req.barberShopInfo.friendlyShopName}!. I'm connecting you to the shop right now. One moment please`;
      // TODO: Play caller a song or waiting sound while we connect them to the shop
      // PhoneSystem.sayMessageToClient(req, res, twiml, connectToShopMessage)
      PhoneSystem.callBarbershop(req, res, twiml)
      res.status(200)
    }
}