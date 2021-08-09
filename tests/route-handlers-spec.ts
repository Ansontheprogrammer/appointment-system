import "mocha";
import * as assert from "assert";
import { app } from "../server";
import supertest from "supertest";

const request = supertest(app);

describe("API Endpoints", () => {
  describe("POST /api/v1/find/schedule/study", () => {
    it("should retrieve study time schedule", (done) => {
      const expectedSchedule = [
        "8:00:00 am - 10:00:00 am",
        "9:00:00 am - 11:00:00 am",
        "10:00:00 am - 12:00:00 pm",
        "2:00:00 pm - 4:00:00 pm",
        "3:00:00 pm - 5:00:00 pm",
        "4:00:00 pm - 6:00:00 pm",
      ];

      const body = {
        from: "2021-06-30",
        to: "2021-01-1",
        id: "mnUgYn4qKeWDlk9Y9Bn1geCI53n1",
        duration: 120,
        interval: 60,
        schedule: {
          weekdays: {
            from: "08:00",
            to: "18:00",
            unavailability: [{ from: "12:00", to: "13:00" }],
          },
          unavailability: [
            { from: "2017-02-20 00:00", to: "2017-02-27 00:00" },
            { date: "2017-02-15", from: "12:00", to: "13:00" },
          ],
        },
      };

      request
        .post(`/api/v1/find/schedule/study`)
        .send(body)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          assert.deepEqual(res.body, expectedSchedule);
          done();
        });
    });

    it("should retrieve rest schedule", (done) => {
      const expectedRestTime = [
        "10:00:00 pm - 6:00:00 am",
        "10:15:00 pm - 6:15:00 am",
        "10:30:00 pm - 6:30:00 am",
        "10:45:00 pm - 6:45:00 am",
        "11:00:00 pm - 7:00:00 am",
        "11:15:00 pm - 7:15:00 am",
        "11:30:00 pm - 7:30:00 am",
      ];

      const body = {
        from: "2017-02-01",
        to: "2017-03-01",
        id: "mnUgYn4qKeWDlk9Y9Bn1geCI53n1",
        duration: 360,
        interval: 15,
        schedule: {
          weekdays: {
            from: "00:00",
            to: "23:45",
            unavailability: [{ from: "12:00", to: "13:00" }],
          },
          unavailability: [
            { from: "2017-02-20 00:00", to: "2017-02-27 00:00" },
            { date: "2017-02-15", from: "12:00", to: "13:00" },
          ],
        },
      };

      request
        .post(`/api/v1/find/schedule/rest`)
        .send(body)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          assert.deepEqual(res.body, expectedRestTime);
          done();
        });
    });
    it("should throw error because schedule type is invalid", (done) => {
      const body = {
        from: "2017-02-01",
        to: "2017-07-01",
        duration: 60,

        interval: 15,
        schedule: {
          weekdays: {
            from: "08:00",
            to: "18:00",
            unavailability: [{ from: "12:00", to: "13:00" }],
          },
          unavailability: [
            { from: "2017-02-20 00:00", to: "2017-02-27 00:00" },
            { date: "2017-02-15", from: "12:00", to: "13:00" },
          ],
          allocated: [
            { from: "2017-02-01 13:00", duration: 60 },
            { from: "2017-02-01 14:00", duration: 60 },
            { from: "2017-02-01 15:00", duration: 60 },
          ],
        },
      };

      request
        .post(`/api/v1/find/schedule/test`)
        .send(body)
        .expect(400)
        .then(
          (body) => done(),
          (err) => done(err)
        );
    });

    it("should throw an error because no schedule type was created", (done) => {
      const body = {
        from: "2017-02-01",
        to: "2017-07-01",
        duration: 60,
        interval: 60,
        schedule: {
          weekdays: {
            from: "08:00",
            to: "18:00",
            unavailability: [{ from: "12:00", to: "13:00" }],
          },
          unavailability: [
            { from: "2017-02-20 00:00", to: "2017-02-27 00:00" },
            { date: "2017-02-15", from: "12:00", to: "13:00" },
          ],
          allocated: [
            { from: "2017-02-01 13:00", duration: 60 },
            { from: "2017-02-01 14:00", duration: 60 },
            { from: "2017-02-01 15:00", duration: 60 },
          ],
        },
      };

      request
        .post(`/api/v1/find/schedule/`)
        .send(body)
        .expect(400)
        .end(function (err, res) {
          if (err) return done();
          done();
        });
    });
  });
});
