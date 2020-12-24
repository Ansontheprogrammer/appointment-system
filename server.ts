import bodyParser from "body-parser";
import express from "express";
import { PhoneSystem } from "./lib/flow/phoneFlow";
import { TextSystem } from "./lib/flow/smsFlow";
import { AppSystem } from "./lib/flow/appFlow";
import * as router from "./lib/router";
import {
  notifyBarber,
  notifyBarberCustomerTriedToCancelWithinTheHour,
  notifyCustomerAboutFeeOnTheirNextVisit,
  sendNotification,
} from "./lib/twilio";
import { Database } from "./lib/db";
import * as flow from "./config/flow";
import cors from "cors";
import { exec } from "child_process";
import uuid from "uuid";
import session from "express-session";
import { resetCronJobs } from "./lib/cron";

const phoneSystem = new PhoneSystem();
const textSystem = new TextSystem();
const appSystem = new AppSystem();

export const app = express();

const port = process.env.PORT || 80;

app.use(express.json()); // to support JSON-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(cors());
const sessionConfig = {
  secret: uuid,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
};
app.use(session(sessionConfig));

// Phone system
app.post("/api/v2/phoneAppointmentFlow", phoneSystem.phoneAppointmentFlow);
app.post("/api/v2/chooseService", phoneSystem.chooseService);
app.post("/api/v2/chosenBarber", phoneSystem.chosenBarber);
app.post("/api/v2/confirmation", phoneSystem.confirmation);
// App system
app.post("/api/v2/bookAppointment", appSystem.bookAppointment);
app.post("/api/v2/walkinAppointment", appSystem.walkInAppointment);
// No call no show
app.post("/api/v2/notifyBarber", notifyBarber);
app.post(
  "/api/v2/notifyBarberCustomerTriedToCancelWithinTheHour",
  notifyBarberCustomerTriedToCancelWithinTheHour
);
app.post(
  "/api/v2/notifyCustomerAboutFeeOnTheirNextVisit",
  notifyCustomerAboutFeeOnTheirNextVisit
);
// Text system
app.post(
  "/api/v2/textMessageFlow",
  textSystem.textMessageFlow,
  flow.processFlow
);
app.get(
  "/api/v2/get/schedule/:barbershop/:barber",
  setSystemConfigMiddleWare,
  appSystem.getBarberAvailableTimes
);
app.post(
  "/api/v2/phone/:barbershop/",
  setSystemConfigMiddleWare,
  phoneSystem.phoneAppointmentFlow
);

app.post(
  "/api/v2/create/appointment/:barbershop/:barber",
  setSystemConfigMiddleWare,
  setClientMiddleWare,
  appSystem.bookAppointment
);
app.delete(
  "/api/v2/delete/appointment/:barbershop/:barber",
  setSystemConfigMiddleWare,
  router.cancelAppointment
);
app.put("/api/v2/update/companyInfo/:barbershop", router.updateCompanyInfo);
app.post(
  "/api/v2/send/:barbershop/:barber/:notification/",
  setSystemConfigMiddleWare,
  sendNotification
);

// Reset server cron jobs
app.get("/api/resetCronJobs", resetCronJobs);
app.get("/api/ping", (req, res, next) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log("Server is up and running");
  console.log(
    "Setting individual shop data...",
    "\nCurrent enviroment:",
    process.env.NODE_ENV
  );
  if (process.env.NODE_ENV === "development") {
    exec("npm run set", (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        process.exit();
      }
      console.log("Finished submitting shop data");
    });
  }
});

export async function setClientMiddleWare(req: any, res, next) {
  try {
    req.session.clientDB = await new Database({
      firstCollection: "barbershops",
      doc: req.params.barbershop,
      secondCollection: "customers",
    });
    return next();
  } catch (err) {
    next(err);
  }
}
export async function setSystemConfigMiddleWare(req: any, res, next) {
  // scheduleBackup("barbershops", req.params.barbershop);

  try {
    // req.barberShopInfo = await new Database({
    //   firstCollection: "barbershops",
    //   doc: req.params.barbershop,
    // }).db.findDataInDocument();

    if (!!req.params.barber) {
      req.barberDB = await new Database({
        firstCollection: "barbershops",
        doc: req.params.barbershop,
        secondCollection: "barbers",
      });

      req.barber = await req.barberDB.db.findOne("name", req.params.barber);
    }

    req.session.clientDB = await new Database({
      firstCollection: "barbershops",
      doc: req.params.barbershop,
      secondCollection: "customers",
    });
    return next();
  } catch (err) {
    next(err);
  }
}
