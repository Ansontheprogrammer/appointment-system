import * as utils from "../../config/utils";
import { database, getBarberAppointments, client } from "../twilio";
import moment from "moment";
import { BARBER, BARBERSHOP, CUSTOMER } from "..";
import { createJob } from "../cron";
import { formatToCronTime } from "../../config/utils";
import { UserMessage } from "../userMessage";
import { Barbershop } from "../db/barbershop";
import { Customer } from "../db/customer";
import uuid from "uuid";

export class AppSystem {
  public async walkInAppointment(req, res, next) {
    const { barber, name, services } = req.body;
    const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber);
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
    const customerDB = new Customer(["barbershop", barbershop.id, "users"]);
    const customer = {
      phoneNumber,
      firstName: name,
    };

    if (!Object.keys(services[0]).length) services.shift();

    let total = 0;
    services.forEach((service) => (total += service.price));

    let duration = 0;
    services.forEach((service) => (duration += service.duration));

    const firstAvailableTime = getBarberAppointments(services, foundBarber)[0];

    if (!firstAvailableTime) {
      // This barber is booked up for the day or shop is closed
      return res.sendStatus(400);
    }

    const confirmationMessage = UserMessage.getConfirmationMessage(
      services,
      barber,
      firstAvailableTime,
      total,
      true
    );

    client.messages.create({
      from: barbershop.twilioNumber,
      body: confirmationMessage,
      to: phoneNumber,
    });

    const time = { from: firstAvailableTime, duration };

    const appointmentData = {
      time,
      services,
      total,
    };

    // try {
    //   await database.addAppointment(barber, customer, appointmentData);
    // } catch (err) {
    //   console.error(err, "error trying to add appointment");
    // }

    // handle if barbershop is closed
    if (utils.shopIsClosed()) {
      return res.send("Barbershop is closed").status(400);
    }

    const reminderMessage = UserMessage.getReminderMessage(
      services,
      barber,
      firstAvailableTime,
      total
    );

    createJob(
      formatToCronTime(firstAvailableTime),
      phoneNumber,
      reminderMessage,
      uuid(),
      barbershop.twilioNumber
    );

    res.sendStatus(200);
  }

  public async getBarberAvailableTimes(req, res, next) {
    const { barberName, fromDate, services } = req.body;

    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const barberDB = new Barbershop(["barbershops", barbershop.id, "barbers"]);
    const foundBarber = (await barberDB.db.AECollection.findOne(
      "barber",
      barberName
    )) as BARBER;
    // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
    // Handle case for retrieving schedules on the dashboard
    if (services.length) {
      if (!Object.keys(services[0]).length) services.shift();
    }

    let availableTimes = getBarberAppointments(services, foundBarber, fromDate);
    availableTimes = availableTimes.map((time) =>
      moment(time, "YYYY-MM-DD HH:mm").format(UserMessage.friendlyFormat)
    );
    res.json({ availableTimes });
  }

  public async bookAppointment(req, res, next) {
    /* 
      Formats:
        Date - MM-DD-YYYY
        Time - ddd, MMMM Do, h:mm a
    */
    const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber);
    const barbershopDB = new Barbershop(["barbershops"]);
    const barbershop = (await barbershopDB.db.AECollection.findOne(
      "phoneNumber",
      res.req.body.To
    )) as BARBERSHOP;
    const barberDB = new Barbershop(["barbershops", barbershop.id, "barbers"]);
    const customerDB = new Customer(["barbershop", barbershop.id, "users"]);
    const customer = (await customerDB.db.AECollection.findOne(
      "phoneNumber",
      phoneNumber
    )) as CUSTOMER;
    const { barber, date, time, name, services } = req.body;
    // remove first element if empty
    if (!Object.keys(services[0]).length) services.shift();

    const dateTime = `${date} ${time}`;
    const formattedDateTime = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format("YYYY-MM-DD HH:mm");

    let duration = 0;
    services.forEach((service) => (duration += service.duration));

    let total = 0;
    services.forEach((service) => (total += service.price));

    const customerInfo = {
      customerData: { phoneNumber, firstName: name },
      appointmentData: {
        time: { from: formattedDateTime, duration },
        services,
        total,
      },
    };

    // database
    //   .addAppointment(
    //     barber,
    //     customerInfo.customerData,
    //     customerInfo.appointmentData
    //   )
    //   .catch((err) => "App Flow - could not add customer appointment");

    customerDB.db.AECollection.createAndUpdateOne({
      id: uuid,
    });

    // send confirmation
    const confirmationMessage = UserMessage.getConfirmationMessage(
      services,
      barber,
      formattedDateTime,
      total,
      true
    );

    client.messages.create({
      from: barbershop.twilioNumber,
      body: confirmationMessage,
      to: phoneNumber,
    });

    const reminderMessage = UserMessage.getReminderMessage(
      services,
      barber,
      formattedDateTime,
      total
    );

    createJob(
      formatToCronTime(formattedDateTime),
      phoneNumber,
      reminderMessage,
      uuid(),
      barbershop.timezone
    );

    res.sendStatus(200);
  }
}
