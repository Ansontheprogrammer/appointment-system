import { formatToCronTime, phoneNumberFormatter } from "../../config/utils";
import { cancelJob, createJob } from "../cron";
import { Database } from "../db";
import { sendText } from "../twilio";
import moment from "moment";

export async function updateCompanyInfo(req, res) {
  const barberShopDoc = new Database({});
  const data = JSON.parse(JSON.stringify(req.body));
  //   const barberShopInfo = await (await barberShopDoc.get()).data();
  //   barberShopDoc.set({ ...barberShopInfo, ...data });
  res.sendStatus(200);
}

export async function cancelAppointment(req, res, next) {
  //   const date = moment(req.body.date, "YYYY-MM-DD HH:mm").format(friendlyFormat);
  let message;
  cancelJob(req.body.appointmentID);
  try {
    await removeAppointmentFromList(req);

    // if(didCustomerTryToCancelWithinOneHour) message = `ALERT! \n${name} just tried to cancel within one hour \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.\nThey are not removed out of the system`
    // message = `${req.body.clientName} just canceled an appointment for \n${date}. \n\nTheir phone number is ${req.body.phoneNumber} if you would like to contact them.`;

    let toPhoneNumber =
      process.env.NODE_ENV === "develop"
        ? "9082097544"
        : req.barber.phoneNumber;
    await sendText(message, toPhoneNumber, req.barberShopInfo.twilioNumber);

    res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
}

export async function removeAppointmentFromList(req) {
  const appointmentFilter = (appointment) =>
    appointment.uuid === req.body.appointmentID;
  const appointmentToRemove = req.barber.appointments.find(appointmentFilter);
  const indexOfAppointmentToRemove = req.barber.appointments.indexOf(
    appointmentToRemove
  );
  req.barber.appointments.splice(
    indexOfAppointmentToRemove,
    indexOfAppointmentToRemove + 1
  );
  // // find the appointment time one hour before
  // const appointmentTimeOneHourBefore = moment(appointmentTime).tz("America/Chicago").subtract(1,"hours").format("YYYY-MM-DD HH:mm");
  // // find the current time in the same appointment time format
  // const currentTime = moment().tz("America/Chicago").format('YYYY-MM-DD HH:mm');
  // // Check if the current time is after the current appointment
  // if(moment(currentTime).isAfter(appointmentTimeOneHourBefore)){
  //   // To close to appointment time, the customer can't delete the appointment
  //   if(!clientData.noCallNoShows.length){
  //     if(process.env.NODE_ENV !== 'develop'){
  //       sendText('You can’t cancel an appointment one hour prior, you will be charged a $10 fee on your next visit', clientData.phoneNumber)
  //     }
  //   } else {
  //     if(process.env.NODE_ENV !== 'develop'){
  //       sendText('You can’t cancel an appointment one hour prior, you will be charged the full cost of your service on your next visit', clientData.phoneNumber)
  //     }
  //   }
  // triedToCancelWithinOneHour = true;
  // return true
  await req.barberDB.db.createAndUpdateOne({
    ...req.barber,
    appointments: req.barber.appointments,
  });
}
export async function bookAppointment(req, res, next) {
  const { date, name, services } = req.body;
  const phoneNumber = phoneNumberFormatter(req.body.phoneNumber);

  let duration = 0,
    total = 0,
    appointmentID;

  services.forEach((service) => {
    duration += service.duration;
    total += service.price;
  });

  const customerInfo = {
    customerData: { phoneNumber, firstName: name },
    appointmentData: {
      time: { from: date, duration },
      services,
      total,
    },
  };
  try {
    appointmentID = await req.barberDB.addAppointment(
      req.barber.name,
      customerInfo.customerData,
      customerInfo.appointmentData
    );
    await req.session.clientDB.db.createAndUpdateOne(phoneNumber);
  } catch (err) {
    return next(`Error adding appointment \n${err}`);
  }

  //   const confirmationMessage = getConfirmationMessage(
  //     services,
  //     req.barber.name,
  //     date,
  //     total
  //   );

  //   const reminderMessage = getReminderMessage(req.barber.name);

  //   const friendlyAppointmentTimeFormat = moment(date, `YYYY-MM-DD HH:mm`).format(
  //     friendlyFormat
  //   );
  // send confirmation
  //   sendText(confirmationMessage, phoneNumber);
  //   sendText(
  //     `${customerInfo.customerData.firstName} just made an appointment for ${friendlyAppointmentTimeFormat}\nHere is their phone number is ${phoneNumber}`,
  //     req.barber.phoneNumber
  //   );

  //   createJob(
  //     formatToCronTime(date),
  //     phoneNumber,
  //     reminderMessage
  //     // appointmentID,
  //     // req.barberShopInfo.timeZone
  //   );

  res.json({ appointmentID });
}
