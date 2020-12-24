import {
  phoneNumberFormatter,
  shopIsClosed,
  getDate,
} from "../../config/utils";
import {
  database,
  getBarberAppointments,
  sendBookLaterDateLink,
  VoiceResponse,
  client,
} from "../twilio";
import uuid from "uuid";
import moment from "moment";
import { BARBER, BARBERSHOP, CUSTOMER } from "../";
import { createJob } from "../cron";
import { UserMessage } from "../userMessage";
import { User } from "../db/customer";
import { Barbershop } from "../db/barbershop";

export class PhoneSystem {
  public async phoneAppointmentFlow(req, res, next) {
    const phoneNumber = phoneNumberFormatter(res.req.body.From);
    const twiml = new VoiceResponse();
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const customerDB = new User(["barbershop", barbershop.id, "users"]);
    /*
          if shop is closed currently send shop is closed message
          sending twiml before creating gather twiml to avoid latency issues
      */
    if (shopIsClosed()) {
      twiml.say(
        `The shop is closed currently. I'm sending you a link to book an appointment at a later date`,
        {
          voice: barbershop.phoneVoice,
        }
      );
      res.send(twiml.toString());
      sendBookLaterDateLink(phoneNumber);
      return;
    }

    let gather, chooseServiceMessage;
    let message = ``;
    for (let prop in barbershop.serviceList) {
      message += `(${prop}) for ${barbershop.serviceList[prop].service}\n`;
    }

    if (Object.keys(barbershop.serviceList).length <= 10) {
      gather = twiml.gather({
        action: "/api/chooseService",
        method: "POST",
        finishOnKey: "#",
        timeout: 3,
      });
      chooseServiceMessage = `Thank you for calling ${barbershop.friendlyName}!. What type of service would you like? Please choose one or more of the following. Press pound when your finish. ${message}`;
    } else {
      gather = twiml.gather({
        action: "/api/chooseService",
        method: "POST",
        timeout: 5,
      });
      chooseServiceMessage = `Thank you for calling ${barbershop.friendlyName}!. What type of service would you like? ${message}`;
    }

    gather.say(chooseServiceMessage, { voice: barbershop.phoneVoice });

    const customer = (await customerDB.db.AECollection.findOne(
      "phoneNumber",
      phoneNumber
    )) as CUSTOMER;

    if (!customer)
      await customerDB.db.AECollection.createAndUpdateOne({
        phoneNumber,
        id: customer.id,
      });
    res.send(twiml.toString());
  }

  public static async callCompany(res, next) {
    const phoneNumber = phoneNumberFormatter(res.req.body.From);
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;

    const customerDB = new User(["barbershop", barbershop.id, "users"]);
    const customer = (await customerDB.db.AECollection.findOne(
      "phoneNumber",
      phoneNumber
    )) as CUSTOMER;

    try {
      const phoneSession = {};
      customerDB.db.AECollection.createAndUpdateOne({
        id: customer.id,
        phoneSession,
        phoneNumber,
      });
    } catch (err) {
      next(err);
    }

    const twiml = new VoiceResponse();
    twiml.say(
      `${UserMessage.generateRandomAgreeWord()}! I'm connecting you to the shop right now.`,
      {
        voice: barbershop.phoneVoice,
      }
    );
    twiml.dial(barbershop.shopPhoneNumber);
    res.set("Content-Type", "text/xml");
    return res.send(twiml.toString());
  }

  public async confirmation(req, res, next) {
    const keyPress = res.req.body.Digits;
    const phoneNumber = phoneNumberFormatter(res.req.body.From);
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const barberDB = new Barbershop(["barbershops", barbershop.id, "barbers"]);
    const foundBarber = (await barberDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBER;
    const customerDB = new User(["barbershop", barbershop.id, "users"]);
    const customer = (await customerDB.db.AECollection.findOne(
      "phoneNumber",
      phoneNumber
    )) as CUSTOMER;
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();
    if (!!keyPress)
      if (keyPress[0] === "0") return PhoneSystem.callCompany(res, next);

    const barber = customer.phoneSession.barber;
    const firstName = customer.firstName;
    const services = customer.phoneSession.services;
    const total = customer.phoneSession.total;
    let time,
      duration = 0;
    const availableTimes = getBarberAppointments(
      customer.phoneSession.services,
      foundBarber
    );
    time = availableTimes[parseInt(keyPress) - 1];

    if (time === undefined) return this.errorMessage(res, "/api/chosenBarber");

    twiml.say(
      `${UserMessage.generateRandomAgreeWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today`,
      { voice: barbershop.phoneVoice }
    );
    services.forEach((service) => (duration += service.duration));

    res.send(twiml.toString());

    const details = {
      services,
      time: { from: time, duration },
      total,
    };

    const reminderMessage = UserMessage.generateReminderMessage(
      services,
      barber,
      time,
      total
    );
    const confirmationMessage = UserMessage.generateConfirmationMessage(
      services,
      barber,
      time,
      total,
      true
    );
    try {
      await database.addAppointment(
        barber,
        { phoneNumber, firstName },
        details
      );

      let currDate = getDate();

      const minutes = moment(time, "h:mm a").format("m");
      const appointmentHour = moment(time, "YYYY-MM-DD h:mm a").format("H");
      const alertHour = parseInt(appointmentHour) - 1;
      let date = currDate.date();

      createJob(
        `0 ${minutes} ${alertHour} ${date} ${currDate.month()} *`,
        phoneNumber,
        reminderMessage,
        uuid(),
        barbershop.timezone
      );
      await customerDB.db.AECollection.createAndUpdateOne({
        id: customer.id,
        time,
        phoneNumber: phoneNumberFormatter(req.body.From),
      });
    } catch (err) {
      next(err);
    }

    client.messages.create({
      from: barbershop.twilioNumber,
      body: confirmationMessage,
      to: phoneNumber,
    });
  }

  private async errorMessage(res, redirectUrl: string) {
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const twiml = new VoiceResponse();

    twiml.say("That was an invalid response", { voice: barbershop.phoneVoice });
    twiml.redirect({ method: "POST" }, redirectUrl);
    res.send(twiml.toString());
  }
}
