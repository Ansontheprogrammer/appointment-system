import admin from "firebase-admin";
import * as types from "../";
import uuid from "uuid/v1";
import { validateAppointmentDetails } from "../../config/utils";
import { AE_Allision } from "ae-backend-database";
import { Database } from ".";

export class User extends Database {}
