import "mocha";
import * as assert from "assert";
import { validateAppointmentDetails } from "../config/utils";

describe("Utility Functions", () => {
  describe("validateAppointmentDetails", () => {
    it("should return that the appointment details are incorrect message - date is invalid", () => {
      const exampleIncorrectAppointment = {
        services: [],
        time: {
          duration: 60,
          from: "Invalid date",
        },
        total: 25,
      };
      const expectedAppointmentDetailValidation = {
        correct: false,
        msg: "Date was invaild",
      };
      const areAppointmentDetailsCorrect = validateAppointmentDetails(
        exampleIncorrectAppointment
      );
      assert.deepEqual(
        areAppointmentDetailsCorrect,
        expectedAppointmentDetailValidation
      );
    });
    it("should return that the appointment details are incorrect message - no appointment duration was supplied", () => {
      const exampleIncorrectAppointment = {
        services: [],
        time: {
          duration: 0,
          from: "2019-10-10",
        },
        total: 25,
      };
      const expectedAppointmentDetailValidation = {
        correct: false,
        msg: "No appointment duration was supplied",
      };
      const areAppointmentDetailsCorrect = validateAppointmentDetails(
        exampleIncorrectAppointment
      );
      assert.deepEqual(
        areAppointmentDetailsCorrect,
        expectedAppointmentDetailValidation
      );
    });
    it("should return that the appointment details are incorrect message - no services were supplied", () => {
      const exampleIncorrectAppointment = {
        services: [],
        time: {
          duration: 60,
          from: "2019-10-10",
        },
        total: 25,
      };
      const expectedAppointmentDetailValidation = {
        correct: false,
        msg: "No services were supplied",
      };
      const areAppointmentDetailsCorrect = validateAppointmentDetails(
        exampleIncorrectAppointment
      );
      assert.deepEqual(
        areAppointmentDetailsCorrect,
        expectedAppointmentDetailValidation
      );
    });
    it("should return that the appointment details are incorrect message - no total", () => {
      const exampleIncorrectAppointment = {
        services: [
          {
            price: 20,
            duration: 30,
            service: "Child’s Haircut (12 and under)",
          },
        ],
        time: {
          duration: 60,
          from: "2019-10-10",
        },
        total: 0,
      };
      const expectedAppointmentDetailValidation = {
        correct: false,
        msg: "No total was supplied",
      };
      const areAppointmentDetailsCorrect = validateAppointmentDetails(
        exampleIncorrectAppointment
      );
      assert.deepEqual(
        areAppointmentDetailsCorrect,
        expectedAppointmentDetailValidation
      );
    });

    it("should return that the appointment details are correct", () => {
      const exampleIncorrectAppointment = {
        services: [
          {
            price: 20,
            duration: 30,
            service: "Child’s Haircut (12 and under)",
          },
        ],
        time: {
          duration: 60,
          from: "2019-11-09",
        },
        total: 25,
      };
      const expectedAppointmentDetailValidation = {
        correct: true,
      };
      const areAppointmentDetailsCorrect = validateAppointmentDetails(
        exampleIncorrectAppointment
      );
      assert.deepEqual(
        areAppointmentDetailsCorrect,
        expectedAppointmentDetailValidation
      );
    });
  });
});
