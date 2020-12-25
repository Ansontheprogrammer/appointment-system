import "mocha";
import { app } from "../server";
import supertest from "supertest";

const request = supertest(app);

describe("Ping GET route", () => {
  it("should return a 200 for ping GET route", (done) => {
    request
      .get("/api/ping")
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        else done();
      });
  });
});
