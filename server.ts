import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import { getAvailableTimes } from "./lib/scheduler";
import { Database } from "./lib/db";

export const app = express();

const port = process.env.PORT || 80;

app.use(express.json()); // to support JSON-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(cors());

/**
 * @api /api/v1/find/schedule/:type Get student ideal schedule
 * @param type can be 'rest' or 'study'
 */
app.post("/api/v1/find/schedule/:type", getAvailableTimes);

app.get("/api/ping", (req, res, next) => {
  res.sendStatus(200);
});

app.listen(port, async () => {
  console.log("Server is up and running");
});
