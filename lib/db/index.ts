import admin from "firebase-admin";
import * as types from "../";
import uuid from "uuid/v1";
import { validateAppointmentDetails } from "../../config/utils";
import { AE_Allision } from "ae-backend-database";
import { Barber } from "./barber";

admin.initializeApp({
  credential: admin.credential.cert("./config/firebaseAdminKey.json"),
});

export const db = admin.firestore();

export class Database {
  db: AE_Allision;

  constructor(path) {
    this.db = new AE_Allision(db, path);
  }

  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  public async addAppointment(
    barberFirstName: string,
    customer: { phoneNumber: string; firstName: string },
    details: types.DETAILS
  ): Promise<string | Error> {
    const { phoneNumber, firstName } = customer;
    const areAppointmentDetailsCorrect = validateAppointmentDetails(details);

    if (!areAppointmentDetailsCorrect.correct) {
      throw Error(areAppointmentDetailsCorrect.msg);
    }

    const appointmentID = uuid.v1();
    const appointment = {
      phoneNumber,
      firstName,
      details,
      uuid: appointmentID,
    };
    try {
      let barber = (await this.db.AECollection.findOne(
        "name",
        barberFirstName
      )) as types.BARBER;
      const appointments = barber.appointments;
      const appointmentAlreadyScheduledForThisTime = !!appointments.find(
        (appointment) => appointment.details.time.from === details.time.from
      );
      if (appointmentAlreadyScheduledForThisTime)
        throw Error("Appointment already scheduled");
      let newAppointmentsArray = appointments.concat(appointment);
      if (!barber.id) barber.id = uuid.v1();
      await this.db.AECollection.createAndUpdateOne({
        ...barber,
        appointments: newAppointmentsArray,
      });
      // Return appointmentID to use to query list if we have to cancel job.
      return appointmentID;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
