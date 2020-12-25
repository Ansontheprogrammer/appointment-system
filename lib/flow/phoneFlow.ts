import { phoneNumberFormatter, addDebugConsoleLog } from "../../config/utils";
import { client } from "../twilio";
import uuid from "uuid";
import { BARBERSHOP, CUSTOMER } from "../";
import { UserMessage } from "../userMessage";
import { Customer } from "../db/customer";
import { Barbershop } from "../db/barbershop";
import twilio from "twilio";
const VoiceResponse = (twilio as any).twiml.VoiceResponse;

export class PhoneSystem {
  public static sayMessageToClient(barbershop: BARBERSHOP, twiml, message) {
    twiml.say(message, { voice: barbershop.phoneVoice });
  }
  public static async callCompany(barbershop: BARBERSHOP, res, twiml, next) {
    const phoneNumber = phoneNumberFormatter(res.req.body.From);
    const customerDB = new Customer([
      "barbershops",
      barbershop.id,
      Customer.customerSubCollectionDBName,
    ]);
    const phoneSession = {};

    try {
      const customer = (await customerDB.db.AECollection.findOne(
        "phoneNumber",
        phoneNumber
      )) as CUSTOMER;
      customerDB.db.AECollection.createAndUpdateOne({
        id: customer.id,
        phoneSession,
        phoneNumber,
      });

      twiml.dial(barbershop.shopPhoneNumber);
      res.set("Content-Type", "text/xml");
      return res.send(twiml.toString());
    } catch (err) {
      if (err === "No matching documents.") {
        customerDB.db.AECollection.createAndUpdateOne({
          id: uuid(),
          phoneSession,
          phoneNumber,
        });
      } else {
        return next(err);
      }
    }
  }

  public async oneStepPhoneFlow(req, res, next) {
    const twiml = new VoiceResponse();
    const connectToShopMessage = `Thank you for calling AnsonErvin ink!. I'm connecting you to the shop right now. One moment please`;
    // TODO: Play caller a song or waiting sound while we connect them to the shop
    PhoneSystem.sayMessageToClient(
      req.session.barbershop,
      twiml,
      connectToShopMessage
    );
    return res.status(200);
  }

  public async phoneAppointmentFlow(req, res, next) {
    const barbershop = req.session.barbershop;
    const twiml = new VoiceResponse();
    const phoneSession = {};
    const phoneNumber = req.session.phoneNumber;
    addDebugConsoleLog([
      "phoneAppointmentFlow",
      "Just received the barbershop",
      JSON.stringify(barbershop, null, 4),
      twiml,
      phoneNumber,
    ]);

    let gather, chooseServiceMessage;
    let message = ``;
    for (let prop in barbershop.serviceList) {
      message += `(${prop}) for ${barbershop.serviceList[prop].service}\n`;
    }
    addDebugConsoleLog([
      "phoneAppointmentFlow",
      "message to text user",
      message,
      JSON.stringify(barbershop, null, 4),
      "BARBERSHop",
    ]);

    gather = twiml.gather({
      action: `/api/v2/phone/multi/confirmation/${barbershop.id}`,
      method: "POST",
      finishOnKey: "#",
      timeout: 3,
    });
    addDebugConsoleLog([
      "phoneAppointmentFlow",
      "Collected twiml gather",
      gather,
    ]);

    chooseServiceMessage = `Thank for calling ${barbershop.friendlyName}!. What type of service would you like? Please choose one or more of the following. Press pound when your finish. ${message}`;

    gather.say(chooseServiceMessage, { voice: barbershop.phoneVoice });
    addDebugConsoleLog([
      "phoneAppointmentFlow",
      "chooseServiceMessage",
      chooseServiceMessage,
    ]);
    const customerDB = new Customer([
      "barbershops",
      barbershop.id,
      Customer.customerSubCollectionDBName,
    ]);
    try {
      const customer = (await customerDB.db.AECollection.findOne(
        "phoneNumber",
        phoneNumber
      )) as CUSTOMER;
      addDebugConsoleLog(["phoneAppointmentFlow", "customer ID", customer.id]);
      await customerDB.db.AECollection.createAndUpdateOne({
        id: customer.id,
        phoneSession,
        phoneNumber,
      });

      res.set("Content-Type", "text/xml");
      return res.send(twiml.toString());
    } catch (err) {
      if (err === "No matching documents.") {
        customerDB.db.AECollection.createAndUpdateOne({
          id: uuid(),
          phoneSession,
          phoneNumber,
        });
        res.sendStatus(200);
      } else {
        return next(err);
      }
    }
    res.send(twiml.toString());
  }

  public async confirmation(req, res, next) {
    const keyPress = res.req.body.Digits;
    const twiml = new VoiceResponse();
    const phoneNumber = req.session.phoneNumber;
    const barbershop = req.session.barbershop;
    const barberDB = new Barbershop(["barbershops", barbershop.id, "barbers"]);
    let foundBarber;

    try {
      const allBarbers = await barberDB.db.AECollection.findAll();
      foundBarber = allBarbers[keyPress];
      addDebugConsoleLog([
        "confirmation",
        "Just Found barber from db",
        keyPress,
        "keyPress",
        foundBarber,
      ]);
      if (!!keyPress) {
        if (keyPress === "0") {
          addDebugConsoleLog(["confirmation", "User pressed 0"]);
          return PhoneSystem.callCompany(barbershop, res, twiml, next);
        } else if (foundBarber) {
          addDebugConsoleLog([
            "confirmation",
            "in found barber condition",
            phoneNumber,
            JSON.stringify(barbershop, null, 4),
            "user phone number",
          ]);
          const message = `${UserMessage.getRandomAgreeWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today`;
          twiml.say(message, { voice: barbershop.phoneVoice });
          client.messages.create({
            from: barbershop.twilioNumber,
            body: message,
            to: phoneNumber,
          });
          res.send(twiml.toString());
          return res.status(200);
        } else {
          addDebugConsoleLog(["confirmation", "sending error Message"]);
          return PhoneSystem.errorMessage(
            barbershop,
            res,
            `/api/v2/phone/multi/confirmation/${barbershop.id}`
          );
        }
      }
    } catch (err) {
      next(err);
    }
  }

  private static async errorMessage(barbershop, res, redirectUrl: string) {
    const twiml = new VoiceResponse();

    twiml.say("That was an invalid response", { voice: barbershop.phoneVoice });
    twiml.redirect({ method: "POST" }, redirectUrl);
    res.send(twiml.toString());
  }
}
