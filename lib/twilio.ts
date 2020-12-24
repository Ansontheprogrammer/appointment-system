import config from "../config/config";
import twilio from "twilio";
import { Database } from "./db";
import * as types from "./";
import { Scheduler, TimeAvailability } from "@ssense/sscheduler";
import moment from "moment";
import { removeDuplicates } from "../config/utils";
import { PhoneSystem } from "./flow/phoneFlow";
import { UserMessage } from "./userMessage";

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
);
export const VoiceResponse = (twilio as any).twiml.VoiceResponse;
export const MessagingResponse = (twilio as any).twiml.MessagingResponse;
export const database = new Database([]);
const scheduler = new Scheduler();

export function getAvailableTimes(
  duration: number,
  interval: number,
  allocatedTimes: types.ALLOCATED_TIMES[],
  from: string,
  to: string,
  barber: types.BARBER
): TimeAvailability[] {
  // set time to get available times
  return scheduler.getIntersection({
    from,
    to,
    duration,
    interval,
    schedules: [
      {
        // ...barberShopAvailability,
        unavailability: [
          {
            from: `${from} ${barber.unavailabilities.lunch.from}`,
            to: `${from} ${barber.unavailabilities.lunch.to}}`,
          },
          ...barber.unavailabilities.offDays,
          ...barber.unavailabilities.unavailableTimes,
          ...barber.unavailabilities.vacations,
        ],
        allocated: allocatedTimes,
      },
    ],
  })[from];
}

export function getBarberAppointments(
  services: types.SERVICES[],
  barber: types.BARBER,
  date?: string
): string[] {
  const currentDateAndTime = moment();
  let from = currentDateAndTime.format("YYYY-MM-DD");

  if (!!date) from = moment(date).format("YYYY-MM-DD");

  let to = moment(from).add(1, "day").format("YYYY-MM-DD");
  const barbersAllocatedTimes = barber.appointments.map(
    (appointment) => appointment.details.time
  );
  let totalDuration = 0;
  // sum up total durations
  services.forEach((service) => (totalDuration += service.duration));
  // TODO: think of a way to architect it to provide different features per shop
  // FADESOFGRAY - if customer didn't just order a hair lining, lets change interval to 30
  let interval;
  interval = 30;

  let availableTimes = getAvailableTimes(
    totalDuration,
    interval,
    barbersAllocatedTimes,
    from,
    to,
    barber
  );

  if (!availableTimes) return [];
  return formatAllocatedTimes(availableTimes).map((time) =>
    moment(`${from} ${time}`, "YYYY-MM-DD h:mm a").format("YYYY-MM-DD HH:mm")
  );
}

export function formatAllocatedTimes(
  barbersAllocatedTimes: TimeAvailability[]
) {
  return barbersAllocatedTimes
    .filter((availability) => availability.available)
    .map((availability) => moment(availability.time, "HH:mm").format("h:mm a"));
}

// export function createBarber(req, res, next) {
//   /**
//    * @req body = BARBER
//    */
//   new Database().createBarber(req.body as types.BARBER).then(() => {
//     res.sendStatus(200);
//   }, next);
// }

// export function sendshopIsClosedMessage(phoneNumber, res?) {
//   client.messages.create({
//     from: twilioPhoneNumber,
//     body: "The shop is currently closed\n",
//     to: phoneNumber,
//   });
//   sendBookLaterDateLink(phoneNumber);
// }

export async function cancelRecentAppointment(req, res) {
  let message;
  // if the customer has a uuid that means they have appointments in the database
  if (!!req.customer.uuid) {
    const { phoneNumber, uuid } = req.customer;
    // const url = `${barberShopURL}/client?phoneNumber=${phoneNumber}&uuid=${uuid}`;
    // message = `Here's a link to cancel your appointment \n${url}`;
  } else {
    message = `Hey, seems like you haven't booked an appointment with anyone. \nYou need to book an appointment first before trying to cancel one.`;
  }
  // client.messages.create({
  //   from: twilioPhoneNumber,
  //   body: message,
  //   to: req.customer.phoneNumber,
  // });
}

export async function sendBookLaterDateLink(phoneNumber: string) {
  // const url = `${barberShopURL}/cue`;
  // const message = `Here's a link to book at a later date ${url}`;
  // client.messages.create({
  //   from: twilioPhoneNumber,
  //   body: message,
  //   to: phoneNumber,
  // });
}

export async function notifyBarber(req, res, next) {
  const { customer, barberName } = req.body;
  const { phoneNumber, name } = customer;
  let date = customer.date;
  date = moment(date, "YYYY-MM-DD HH:mm").format(UserMessage.friendlyFormat);
  const message = `${name} just canceled an appointment for \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`;
  // const barberData = await database.findBarberInDatabase(barberName);

  // client.messages.create({
  //   from: twilioPhoneNumber,
  //   body: message,
  //   to: barberData.phoneNumber,
  // });

  res.sendStatus(200);
}

export async function notifyBarberCustomerTriedToCancelWithinTheHour(
  req,
  res,
  next
) {
  const { customer, barberName } = req.body;
  const { phoneNumber, name } = customer;
  let date = customer.date;
  date = moment(date, "YYYY-MM-DD HH:mm").format(UserMessage.friendlyFormat);
  const message = `${name} tried to cancel an appointment within the hour for \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`;
  // const barberData = await database.findBarberInDatabase(barberName);

  // client.messages.create({
  //   from: twilioPhoneNumber,
  //   body: message,
  //   to: barberData.phoneNumber,
  // });

  res.sendStatus(200);
}

export async function phoneFlow(req, res, next) {
  const twiml = new VoiceResponse();
  // const connectToShopMessage = `Thank you for calling ${req.barberShopInfo.friendlyShopName}!. I'm connecting you to the shop right now. One moment please`;
  // TODO: Play caller a song or waiting sound while we connect them to the shop
  // PhoneSystem.sayMessageToClient(req, res, twiml, connectToShopMessage)
  PhoneSystem.callBarbershop(req, res);
  res.status(200);
}

export async function notifyCustomerAboutFeeOnTheirNextVisit(req, res, next) {
  const { amountOfTimesTheyHaveCanceled, customerPhoneNumber } = req.body;
  let message;
  if (amountOfTimesTheyHaveCanceled === 0) {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged a $10 fee on your next visit.`;
  } else {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged the total cost of your service on your next visit.`;
  }

  // client.messages.create({
  //   from: twilioPhoneNumber,
  //   body: message,
  //   to: customerPhoneNumber,
  // });

  res.sendStatus(200);
}

// export function resetCronJobs(req, res, next) {
//   barberCollection.get().then((snapshot) => {
//     snapshot.docs.forEach((doc) => {
//       const barber = doc.id;
//       const barberAppointments = doc.get(
//         "appointments"
//       ) as types.BARBER_APPOINTMENTS[];
//       barberAppointments.forEach((appointment) => {
//         const reminderMessage = UserMessage.generateReminderMessage(
//           appointment.details.services,
//           barber as any,
//           appointment.details.time.from,
//           appointment.details.total
//         );
//         console.log(
//           `Creating job for ${barber}\n${appointment.firstName}\nAt - ${appointment.details.time.from}`
//         );
//         // createJob(
//         //   formatToCronTime(appointment.details.time.from),
//         //   appointment.phoneNumber,
//         //   reminderMessage
//         // );
//       });
//     });
//     res.sendStatus(200);
//   });
// }

// export function sendTextMessageBlast(req, res, next) {
//   const { barberName, messageToBlast } = req.body;
//   database.findBarberInDatabase(barberName).then(
//     (barber) => {
//       const appointments = barber.appointments;
//       let customerPhoneNumbersToBlastToo;
//       if (process.env.NODE_ENV === "test") {
//         customerPhoneNumbersToBlastToo = ["9082097544"];
//       } else {
//         const phoneNumbersToBlast = appointments.map(
//           (appointment) => appointment.phoneNumber
//         );
//         customerPhoneNumbersToBlastToo = ArrNoDupe(phoneNumbersToBlast);
//       }
//       // Send blast text message
//       const sendBlastTextMessagePromises = customerPhoneNumbersToBlastToo.map(
//         (phoneNumber, index) => {
//           return sendText(messageToBlast, phoneNumber, true);
//         }
//       );

//       Promise.all(sendBlastTextMessagePromises).then(() => res.sendStatus(200));
//     },
//     (err) => res.sendStatus(400)
//   );
// }

export async function sendText(
  message: string,
  toPhoneNumber: string,
  fromPhoneNumber?: string
) {
  let twilioNumberToUse =
    process.env.NODE_ENV === "develop" ? "+16124393345" : fromPhoneNumber;

  return await client.messages
    .create({
      from: twilioNumberToUse,
      body: message,
      to: toPhoneNumber,
    })
    .then(() => {
      return;
    });
}

export function sendNotification(req, res, next) {
  const { notification } = req.params;
  switch (notification) {
    case "textBlast":
      return sendTextMessageBlast(req, res, next);
    case "noCallNoShow":
      return notifyCustomerAboutFeeOnTheirNextVisit(req, res, next);
  }
}
export function sendTextMessageBlast(req, res, next) {
  const { message } = req.body;
  let customerPhoneNumbersToBlastToo;
  if (process.env.NODE_ENV === "development") {
    customerPhoneNumbersToBlastToo = ["9082097544"];
  } else {
    const phoneNumbersToBlast = req.barber.appointments.map(
      (appointment) => appointment.phoneNumber
    );
    customerPhoneNumbersToBlastToo = removeDuplicates(phoneNumbersToBlast);
  }
  // Send blast text message
  const sendBlastTextMessagePromises = customerPhoneNumbersToBlastToo.map(
    (phoneNumber: string) => {
      return sendText(message, phoneNumber);
    }
  );

  Promise.all(sendBlastTextMessagePromises).then(
    () => res.sendStatus(200),
    next
  );
}
