import bodyParser from "body-parser";
import express from "express";
import { PhoneSystem } from "./lib/flow/phoneFlow";
import { AppSystem } from "./lib/flow/api";
import * as router from "./lib/router";
import * as middleware from "./lib/middleware";
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
import { shopIsClosed } from "./config/utils";
// import { resetCronJobs } from "./lib/cron";

const phoneSystem = new PhoneSystem();
// const textSystem = new TextSystem();
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

// DATA ENDPOINTS
app.put("/api/v2/update/company/:barbershop", router.updateCompanyInfo);

// APPOINTMENT ENDPOINTS
app.post(
  "/api/v2/appointment/create/:barbershop/:barber",
  setSystemConfigMiddleWare,
  setClientMiddleWare,
  appSystem.bookAppointment
);
app.post(
  "/api/v2/appointment/create/nextAvailable",
  appSystem.walkInAppointment
);

app.delete(
  "/api/v2/appointment/delete/:barbershop/:barber",
  setSystemConfigMiddleWare,
  router.cancelAppointment
);

// Notifications
app.post("/api/v2/notification/:barbershop/:barber/:type", notifyBarber);
app.post(
  "/api/v2/notification/:barbershop/:barber/:type",
  notifyBarberCustomerTriedToCancelWithinTheHour
);
app.post(
  "/api/v2/notification/:barbershop/:barber/:type",
  notifyCustomerAboutFeeOnTheirNextVisit
);
app.post(
  "/api/v2/send/:barbershop/:barber/:notification/",
  setSystemConfigMiddleWare,
  sendNotification
);

// Text system

// app.post(
//   "/api/v2/textMessageFlow",
//   textSystem.textMessageFlow,
//   flow.processFlow
// );

/**
 * @api /api/v2/get/schedule/ Get barber schedule
 */
app.get(
  "/api/v2/get/schedule/:barbershop/:barber",
  setSystemConfigMiddleWare,
  appSystem.getBarberAvailableTimes
);

// PHONE SYSTEM */
// ONE SET PHONE FLOW
/**
 * @api /api/v2/phone/single/welcome/:barbershop Start company phone tree
 */
app.post(
  "/api/v2/phone/single/welcome/:barbershop",
  middleware.default.phoneFlowMiddleWare,
  phoneSystem.oneStepPhoneFlow
);
// MULTI STEP PHONE FLOW
/**
 * @api /api/v2/phone/multi/welcome/:barbershop Start company phone tree
 */
app.post(
  "/api/v2/phone/multi/welcome/:barbershop",
  middleware.default.phoneFlowMiddleWare,
  phoneSystem.phoneAppointmentFlow
);
/**
 * @api /api/v2/phone/confirmation Move to step 2 of phone tree
 */
app.post(
  "/api/v2/phone/multi/confirmation/:barbershop",
  middleware.default.phoneFlowMiddleWare,
  phoneSystem.confirmation
);

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
  } else {
    // Reset server cron jobs
    /**
     */
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
