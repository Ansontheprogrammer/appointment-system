import { BARBERSHOP } from "..";
import {
  addDebugConsoleLog,
  phoneNumberFormatter,
  shopIsClosed,
} from "../../config/utils";
import { Barbershop } from "../db/barbershop";
import twilio from "twilio";
import { sendBookLaterDateLink } from "../twilio";
import { PhoneSystem } from "../flow/phoneFlow";
const VoiceResponse = (twilio as any).twiml.VoiceResponse;

const twiml = new VoiceResponse();

export async function phoneFlowMiddleWare(req, res, next) {
  const phoneNumber = phoneNumberFormatter(res.req.body.From);
  const twiml = new VoiceResponse();
  let barbershop;
  addDebugConsoleLog(["phoneFlowMiddleWare", "Init"]);
  const barbershopDB = new Barbershop(["barbershops"]);

  if (!req.session.barbershop) {
    barbershop = (await barbershopDB.db.AECollection.findOne(
      "id",
      req.params.barbershop
    )) as BARBERSHOP;
    req.session.barbershop = barbershop;
    req.session.barbershopDB = barbershopDB;
    req.session.phoneNumber = phoneNumber;
  } else {
    barbershop = req.session.barbershop;
    req.session.barbershopDB = barbershopDB;
    req.session.phoneNumber = phoneNumber;
  }
  addDebugConsoleLog([
    "phoneFlowMiddleWare",
    "req.session.barbershop",
    JSON.stringify(req.session.barbershop, null, 4),
  ]);
  if (shopIsClosed()) {
    twiml.say(
      `The company is closed currently, sorry for the inconvience. I'm sending you a text right now for our text app. We thank you for calling!`,
      {
        voice: barbershop.phoneVoice,
      }
    );
    res.send(twiml.toString());
    sendBookLaterDateLink(barbershop.shopPhoneNumber);
  }

  next();
}
