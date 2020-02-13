import config from '../config/config'
import twilio from 'twilio'
import {
  Database,
  barbersInShop,
  serviceList,
  barberShopURL,
  barberShopAvailability,
  twilioPhoneNumber,
  barberCollection,
  friendlyShopName,
} from './database'
import * as types from './'
import moment from 'moment-timezone'
import { formatToCronTime } from '../config/utils';
import { createJob, cancelJob } from './cron'
import { TextInterface } from './flow/smsFlow/textInterface'
export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()

export function createBarber(req, res, next) {
  /**
   * @req body = BARBER
   */
  new Database().createBarber(req.body as types.BARBER).then(() => {
    res.sendStatus(200)
  }, next)
}

export function sendshopIsClosedMessage(phoneNumber, res?) {
  client.messages.create({
    from: twilioPhoneNumber,
    body: 'The shop is currently closed\n',
    to: phoneNumber
  })
  sendBookLaterDateLink(phoneNumber)
}

export class UserMessages {
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to view your appointments \nText: (View)`
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`
  friendlyFormat = 'ddd, MMMM Do, h:mm a'
  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`

  public agreeWords = [
    'Great',
    'Thanks',
    'Fantastic',
    'Awesome',
    'Amazing',
    'Sweet',
    'Okay',
    'Phenomenal'
  ]

  public introGreetingWords = ['How are you doing', 'How have you been', 'Long time no see']

  public getRandomAgreeWord = () =>
    this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)]

  public getRandomGreeting = () =>
    this.introGreetingWords[
    Math.floor(Math.random() * this.introGreetingWords.length)
    ]

  public getFriendlyTimeFormat = time => {
    return moment(time, 'HH:mm').format('h:mm a')
  }

  public getConfirmationMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number,
    noConfirmation: boolean
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating confirmation message')
    time = moment(time, 'YYYY-MM-DD HH:mm').format(this.friendlyFormat)
    const message = `${this.getRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      service => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to view your appointments text (view)`
    if (noConfirmation) return message
    else
      return message.concat(
        '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
      )
  }

  public getTextInterfaceMessage() {
    const options = TextInterface.userInterfaceOptions;
    let message = `Welcome to the ${friendlyShopName} help interface. How can I help you today? Press:\n`
    for (let option in options) message += `\n(${options[option].action}) ${options[option].name}`
    return message
  }

  public getReminderMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number
  ) {

    if (!services.length || !barberName || !time || !total) {
      throw Error('ERR - error creating reminder message')
    }

    time = moment(time, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do, h:mm a')
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
      service => `\n${service.service}`
    )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
  }

  public getAvailableServicesMessage() {
    let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`

    for (let prop in serviceList) {
      message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
    }
    return message
  }

  public getGetBarberAvailableTimesMessage(barberSchedule: string[]) {
    return `Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public getErrorValidatingAppointmentTime(barberSchedule: string[]) {
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public getChooseBarberMessage() {
    return `Which barber would you like today? Press: \n${barbersInShop.map(
      (barber, index) => `\n(${index + 1}) for ${barber}`
    )}`
  }

  public getShopHoursMessage() {
    let message = `Here are the shop's hours:\n\n`
    let day: types.DAY
    const formatTime = (time: string) => new UserMessages().getFriendlyTimeFormat(time)

    for (day in barberShopAvailability) {
      message += `${Database.firstLetterUpperCase(day)} - ${formatTime(barberShopAvailability[day].from)} to ${formatTime(barberShopAvailability[day].to)}  `
    }

    return message
  }
}


export async function cancelRecentAppointment(req, res) {
  let message;
  // if the customer has a uuid that means they have appointments in the database
  if (!!req.customer.uuid) {
    const { phoneNumber, uuid } = req.customer
    const url = `${barberShopURL}/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
    message = `Here's a link to cancel your appointment \n${url}`
  }
  else {
    message = `Hey, seems like you haven't booked an appointment with anyone. \nYou need to book an appointment first before trying to cancel one.`
  }
  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: req.customer.phoneNumber
  })
}

export async function sendBookLaterDateLink(phoneNumber: string) {
  const url = `${barberShopURL}/cue`
  const message = `Here's a link to book an appointment ${url}`
  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: phoneNumber
  })
}

export async function cancelAppointment(req, res, next) {
  const { customer, barberName, id } = req.body
  const { phoneNumber, name } = customer
  let date = customer.date
  date = moment(date, 'YYYY-MM-DD HH:mm').format(new UserMessages().friendlyFormat)
  let message;
  cancelJob(id);
  try {
    const barberData = await database.findBarberInDatabase(barberName)
    const clientData = await database.findCustomerInDatabase(phoneNumber)
    await removeAppointmentFromList(barberName, id, clientData)
    // if(didCustomerTryToCancelWithinOneHour) message = `ALERT! \n${name} just tried to cancel within one hour \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.\nThey are not removed out of the system`
    message = `${name} just canceled an appointment for \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`

    let toPhoneNumber = process.env.NODE_ENV === 'develop' ? '9082097544' : barberData.phoneNumber
    await sendText(message, toPhoneNumber)
    res.sendStatus(200)
  } catch (err) {
    return next(err)
  }
}

export async function removeAppointmentFromList(barberID, appointmentID, clientData) {
  let triedToCancelWithinOneHour: boolean = false;
  const barberData = await new Database().findBarberInDatabase(barberID)
  const updatedAppointments = barberData.appointments.filter(appointment => {
    // set appointment to notify barber about
    if (appointment.uuid === appointmentID) {
      // find the appointment time
      const appointmentTime = appointment.details.time.from;
      // // find the appointment time one hour before
      // const appointmentTimeOneHourBefore = moment(appointmentTime).tz("America/Chicago").subtract(1,"hours").format("YYYY-MM-DD HH:mm");
      // // find the current time in the same appointment time format
      // const currentTime = moment().tz("America/Chicago").format('YYYY-MM-DD HH:mm');
      // // Check if the current time is after the current appointment
      // if(moment(currentTime).isAfter(appointmentTimeOneHourBefore)){
      //   // To close to appointment time, the customer can't delete the appointment
      //   if(!clientData.noCallNoShows.length){
      //     if(process.env.NODE_ENV !== 'develop'){
      //       sendText('You can’t cancel an appointment one hour prior, you will be charged a $10 fee on your next visit', clientData.phoneNumber)
      //     }
      //   } else {
      //     if(process.env.NODE_ENV !== 'develop'){
      //       sendText('You can’t cancel an appointment one hour prior, you will be charged the full cost of your service on your next visit', clientData.phoneNumber)
      //     }
      //   }
      // triedToCancelWithinOneHour = true;
      // return true
    }
    return appointment.uuid !== appointmentID
  })

  await barberCollection
    .doc(barberID)
    .update({
      appointments: updatedAppointments
    })

  return triedToCancelWithinOneHour;
}

export async function notifyCustomerAboutFeeOnTheirNextVisit(req, res, next) {
  const { amountOfTimesTheyHaveCanceled, customerPhoneNumber } = req.body
  let message;
  if (amountOfTimesTheyHaveCanceled === 0) {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged a $10 fee on your next visit.`
  } else {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged the total cost of your service on your next visit.`
  }

  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: customerPhoneNumber
  })

  res.sendStatus(200)
}

export function resetCronJobs() {
  barberCollection
    .get()
    .then(snapshot => {
      snapshot.docs.forEach(doc => {
        const barberName = doc.id
        const barberAppointments = (doc.get('appointments') as types.BARBER_APPOINTMENTS[]);
        barberAppointments.forEach(appointment => {
          const reminderMessage = this.UserMessage.getReminderMessage(
            appointment.details.services,
            (barberName as any),
            appointment.details.time.from,
            appointment.details.total
          )
          console.log(`Creating job for ${barberName}\n${appointment.firstName}\nAt - ${appointment.details.time.from}`)
          createJob(
            formatToCronTime(appointment.details.time.from),
            appointment.phoneNumber,
            reminderMessage,
            appointment.uuid
          )
        })
      })
    })
}

export function sendTextMessageBlast(req, res, next) {
  const { barberName, messageToBlast } = req.body
  database.findBarberInDatabase(barberName).then(barber => {
    const appointments = barber.appointments
    let customerPhoneNumbersToBlastToo;
    if (process.env.NODE_ENV === 'test') {
      customerPhoneNumbersToBlastToo = ['9082097544']
    } else {
      const phoneNumbersToBlast = appointments.map(appointment => appointment.phoneNumber)
      customerPhoneNumbersToBlastToo = ArrNoDupe(phoneNumbersToBlast);
    }
    // Send blast text message 
    const sendBlastTextMessagePromises = customerPhoneNumbersToBlastToo.map((phoneNumber, index) => {
      return sendText(messageToBlast, phoneNumber)
    });

    Promise.all(sendBlastTextMessagePromises).then(() => res.sendStatus(200))
  }, err => res.sendStatus(400))
}

function ArrNoDupe(a) {
  var temp = {};
  for (var i = 0; i < a.length; i++)
    temp[a[i]] = true;
  var r = [];
  for (var k in temp)
    r.push(k);
  return r;
}

export async function sendText(message: string, toPhoneNumber: string) {
  let twilioNumberToUse = process.env.NODE_ENV !== 'develop' ? '16125023342' : twilioPhoneNumber

  return await client.messages.create({
    from: twilioNumberToUse,
    body: message,
    to: toPhoneNumber
  }).then(() => { return })
}