import moment from "moment";
import * as types from "./";

export class UserMessageInterface {
  agreeWords = [
    "Great",
    "Thanks",
    "Fantastic",
    "Awesome",
    "Amazing",
    "Sweet",
    "Okay",
    "Phenomenal",
  ];
  introGreetingWords = ["How you doing", "How you been", "Long time no see"];
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`;
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`;
  friendlyFormat = "ddd, MMMM Do, h:mm a";

  public generateRandomAgreeWord = () =>
    this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)];
  public generateRandomGreeting = () =>
    this.introGreetingWords[
      Math.floor(Math.random() * this.introGreetingWords.length)
    ];

  public generateConfirmationMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number,
    noConfirmation: boolean
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error("ERR - error creating confirmation message");
    time = moment(time, "YYYY-MM-DD HH:mm").format(this.friendlyFormat);
    const message = `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      (service) => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to cancel this appointment text (remove)`;
    if (noConfirmation) return message;
    else
      return message.concat(
        "\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO"
      );
  }

  public generateReminderMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number
  ) {
    if (!services.length || !barberName || !time || !total) {
      throw Error("ERR - error creating reminder message");
    }

    time = moment(time, "YYYY-MM-DD HH:mm").format("dddd, MMMM Do, h:mm a");
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
      (service) => `\n${service.service}`
    )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`;
  }

  // public generateAvailableServicesMessage() {
  //   let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`;

  //   for (let prop in serviceList) {
  //     message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`;
  //   }
  //   return message;
  // }

  public generateGetBarberAvailableTimesMessage(barberSchedule: string[]) {
    return `Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`;
  }

  public generateErrorValidatingAppointmentTime(barberSchedule: string[]) {
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`;
  }

  // public generateChooseBarberMessage() {
  //   return `Which barber would you like today? Press: \n${barbersInShop.map(
  //     (barber, index) => `\n(${index + 1}) for ${barber}`
  //   )}`;
  // }

  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`;
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`;
}

export const UserMessage = new UserMessageInterface();
