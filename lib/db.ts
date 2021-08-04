import admin from "firebase-admin";
import { AE_Allision } from "ae-backend-database";

var serviceAccount = require("../../config/consilium-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://consilium-f32c9.firebaseio.com",
});

const db = admin.firestore();

export class Database {
  private db: AE_Allision;

  constructor() {
    this.db = this.getEventCollection();
  }

  private getEventCollection() {
    return new AE_Allision(db, ["events"]);
  }

  async findUserEvents(id: string) {
    try {
      console.log("ABOUT TO RETRIEVE DB");
      return Promise.resolve(
        await db.collection("events").where("joinedUsers", "array-contains", id)
      );
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
