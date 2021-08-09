import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import { getAvailableTimes } from "./lib/scheduler";
import { Database } from "./lib/db";
import fs from "fs";
import path from "path";
export const app = express();
import { authorize, listEvents } from "./lib/google_calendar";

const port = process.env.PORT || 3000;

app.use(express.json()); // to support JSON-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(cors());

/**
 * @api /api/v1/find/schedule/:type Get student ideal schedule
 * @param type can be 'rest' or 'study'
 */
app.post("/api/v1/find/schedule/:type", getAvailableTimes);

app.get("/api/webhook/calendar", (req, res, next) => {
  return new Promise((resolve, reject) => {
    console.log(req.query, "code");
    fs.readFile("./config/credentials.json", async (err, content) => {
      if (err) return reject("Error loading client secret file:");
      // Authorize a client with credentials, then call the Google Calendar API.
      try {
        const auth = await authorize(
          JSON.parse(content.toString()),
          req.query.code
        );
        console.log(auth, "auth");
        await listEvents(auth);

        resolve(res.send(200));
      } catch (err) {
        throw err;
      }
    });
  });
});

app.get("/api/ping", (req, res, next) => {
  res.sendStatus(200);
});

/// Google service verification
app.get("/googlece24a5461fe1331e.html", (req, res, next) => {
  var filePath = path.join(__dirname, "../config/googlece24a5461fe1331e.html");
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Content-Length": stat.size,
  });

  var readStream = fs.createReadStream(filePath);
  // We replaced all the event handlers with a simple call to readStream.pipe()
  readStream.pipe(res);
});
app.listen(port, () => {
  return new Promise((resolve, reject) => {
    console.log("Server is up and running");
    // Load client secrets from a local file.
    fs.readFile("./config/credentials.json", async (err, content) => {
      if (err) return Promise.reject("Error loading client secret file");
      // Authorize a client with credentials, then call the Google Calendar API.
      return Promise.resolve();
    });
  });
});
