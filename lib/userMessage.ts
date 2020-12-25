import moment from "moment";
import * as types from "./";
import { TextInterface } from "./flow/sms/interface";

export class UserMessagesInterface {
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`;
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`;
  friendlyFormat = "ddd, MMMM Do, h:mm a";
  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`;
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`;

  public agreeWords = [
    "Great",
    "Thanks",
    "Fantastic",
    "Awesome",
    "Amazing",
    "Sweet",
    "Okay",
    "Phenomenal",
  ];

  public introGreetingWords = [
    "How are you doing",
    "How have you been",
    "Long time no see",
  ];

  public getRandomAgreeWord = () =>
    this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)];

  public getRandomGreeting = () =>
    this.introGreetingWords[
      Math.floor(Math.random() * this.introGreetingWords.length)
    ];

  public getFriendlyTimeFormat = (time) => {
    return moment(time, "HH:mm").format("h:mm a");
  };

  public getConfirmationMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number,
    noConfirmation: boolean
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error("ERR - error creating confirmation message");
    time = moment(time, "YYYY-MM-DD HH:mm").format(this.friendlyFormat);
    const message = `${this.getRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      (service) => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to view your appointments text (view)`;
    if (noConfirmation) return message;
    else
      return message.concat(
        "\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO"
      );
  }

  public getTextInterfaceMessage(shopName: string) {
    const options = TextInterface.userInterfaceOptions;
    let message = `Welcome to the ${shopName} help interface. How can I help you today? Press:\n`;
    for (let option in options)
      message += `\n(${options[option].action}) ${options[option].name}`;
    return message;
  }

  public getReminderMessage(
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

  //   public getAvailableServicesMessage() {
  //     let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`;

  //     for (let prop in serviceList) {
  //       message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`;
  //     }
  //     return message;
  //   }

  public getGetBarberAvailableTimesMessage(barberSchedule: string[]) {
    return `Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`;
  }

  public getErrorValidatingAppointmentTime(barberSchedule: string[]) {
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`;
  }

  //   public getChooseBarberMessage() {
  //     return `Which barber would you like today? Press: \n${barbersInShop.map(
  //       (barber, index) => `\n(${index + 1}) for ${barber}`
  //     )}`;
  //   }

  //   public getShopHoursMessage() {
  //     let message = `Here are the shop's hours:\n\n`;
  //     let day: types.DAY;
  //     const formatTime = (time: string) =>
  //       new UserMessages().getFriendlyTimeFormat(time);

  //     for (day in barberShopAvailability) {
  //       message += `${Database.firstLetterUpperCase(day)} - ${formatTime(
  //         barberShopAvailability[day].from
  //       )} to ${formatTime(barberShopAvailability[day].to)}  `;
  //     }

  //     return message;
  //   }
}

export const UserMessage = new UserMessagesInterface();
