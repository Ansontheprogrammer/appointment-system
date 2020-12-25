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
}
