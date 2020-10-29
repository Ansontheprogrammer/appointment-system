import config from '../config/config'
import twilio from 'twilio'
import {
  Database,
} from './database'
import * as types from './'
import { Scheduler, TimeAvailability } from '@ssense/sscheduler'
import moment from 'moment'
import { formatToCronTime } from '../config/utils';
import { createJob } from './cron'
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
const scheduler = new Scheduler()

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse

export async function notifyCustomerAboutFeeOnTheirNextVisit(req, res, next) {
  const { amountOfTimesTheyHaveCanceled, customerPhoneNumber } = req.body
  let message;
  if (amountOfTimesTheyHaveCanceled === 0) {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged a $10 fee on your next visit.`
  } else {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged the total cost of your service on your next visit.`
  }
  try {
    await sendText(message, customerPhoneNumber)
  } catch(err) { next(err) }

  res.sendStatus(200)
}

export function sendTextMessageBlast(req, res, next) {
  const { message } = req.body
    let customerPhoneNumbersToBlastToo;
    if (process.env.NODE_ENV === 'development') {
      customerPhoneNumbersToBlastToo = ['9082097544']
    } else {
      const phoneNumbersToBlast = req.barber.appointments.map(appointment => appointment.phoneNumber)
      customerPhoneNumbersToBlastToo = ArrNoDupe(phoneNumbersToBlast);
    }
    // Send blast text message 
    const sendBlastTextMessagePromises = customerPhoneNumbersToBlastToo.map((phoneNumber: string) => {
      return sendText(message, phoneNumber)
    });

    Promise.all(sendBlastTextMessagePromises)
    .then(() => res.sendStatus(200), next)
}

export function sendNotification(req, res, next) {
  const { notification } = req.params
  switch(notification){
    case 'textBlast': 
      return sendTextMessageBlast(req, res, next)
    case 'noCallNoShow':
      return notifyCustomerAboutFeeOnTheirNextVisit(req, res, next)
  }
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

export async function sendText(message: string, toPhoneNumber: string, fromPhoneNumber?: string) {
  let twilioNumberToUse = process.env.NODE_ENV === 'develop' ? '+16124393345' : fromPhoneNumber

  return await client.messages.create({
    from: twilioNumberToUse,
    body: message,
    to: toPhoneNumber
  }).then(() => { return })
}

// export function createBarber(req, res, next) {
//   /**
//    * @req body = BARBER
//    */
//   new Database().createBarber(req.body as types.BARBER).then(() => {
//     res.sendStatus(200)
//   }, next)
// }

// export function sendshopIsClosedMessage(phoneNumber, res?) {
//   client.messages.create({
//     from: twilioPhoneNumber,
//     body: 'The shop is currently closed\n',
//     to: phoneNumber
//   })
//   sendBookLaterDateLink(phoneNumber)
// }

// export class UserMessageInterface {
//   agreeWords = [
//     'Great',
//     'Thanks',
//     'Fantastic',
//     'Awesome',
//     'Amazing',
//     'Sweet',
//     'Okay',
//     'Phenomenal'
//   ]
//   introGreetingWords = ['How you doing', 'How you been', 'Long time no see']
//   confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`
//   chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`
//   friendlyFormat = 'ddd, MMMM Do, h:mm a'

//   public generateRandomAgreeWord = () =>
//     this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)]
//   public generateRandomGreeting = () =>
//     this.introGreetingWords[
//     Math.floor(Math.random() * this.introGreetingWords.length)
//     ]

//   public generateConfirmationMessage(
//     services: types.SERVICES[],
//     barberName: string,
//     time: string,
//     total: number,
//     noConfirmation: boolean
//   ) {
//     if (!services.length || !barberName || !time || !total)
//       throw Error('ERR - error creating confirmation message')
//     time = moment(time, 'YYYY-MM-DD HH:mm').format(this.friendlyFormat)
//     const message = `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
//       service => `\n${service.service}`
//     )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to cancel this appointment text (remove)`
//     if (noConfirmation) return message
//     else
//       return message.concat(
//         '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
//       )
//   }

//   public generateReminderMessage(
//     services: types.SERVICES[],
//     barberName: string,
//     time: string,
//     total: number
//   ) {

//     if (!services.length || !barberName || !time || !total) {
//       throw Error('ERR - error creating reminder message')
//     }

//     time = moment(time, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do, h:mm a')
//     return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
//       service => `\n${service.service}`
//     )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
//   }

//   public generateAvailableServicesMessage() {
//     let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`

//     for (let prop in serviceList) {
//       message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
//     }
//     return message
//   }

//   public generateGetBarberAvailableTimesMessage(barberSchedule: string[]) {
//     return `Here are their available times\nPress:${barberSchedule.map(
//       (slot, i) => `\n\n(${i + 1}) \n${slot}`
//     )}`
//   }

//   public generateErrorValidatingAppointmentTime(barberSchedule: string[]) {
//     return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
//       (slot, i) => `\n\n(${i + 1}) \n${slot}`
//     )}`
//   }

//   public generateChooseBarberMessage() {
//     return `Which barber would you like today? Press: \n${barbersInShop.map(
//       (barber, index) => `\n(${index + 1}) for ${barber}`
//     )}`
//   }

//   errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`
//   errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
// }

// export const UserMessage = new UserMessageInterface()

// export async function cancelRecentAppointment(req, res) {
//   let message;
//   // if the customer has a uuid that means they have appointments in the database
//   if(!!req.customer.uuid){
//     const { phoneNumber, uuid } = req.customer
//     const url = `${barberShopURL}/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
//     message = `Here's a link to cancel your appointment \n${url}`
//   }
//   else {
//     message = `Hey, seems like you haven't booked an appointment with anyone. \nYou need to book an appointment first before trying to cancel one.`
//   }
//   client.messages.create({
//     from: twilioPhoneNumber,
//     body: message,
//     to: req.customer.phoneNumber
//   })
// }

// export async function sendBookLaterDateLink(phoneNumber: string) {
//   const url = `${barberShopURL}/cue`
//   const message = `Here's a link to book at a later date ${url}`
//   client.messages.create({
//     from: twilioPhoneNumber,
//     body: message,
//     to: phoneNumber
//   })
// }

// export async function notifyBarber(req, res, next) {
//   const { customer, barberName } = req.body
//   const { phoneNumber, name } = customer
//   let date = customer.date
//   date = moment(date, 'YYYY-MM-DD HH:mm').format(UserMessage.friendlyFormat)
//   const message = `${name} just canceled an appointment for \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`
//   const barberData = await database.findBarberInDatabase(barberName)

  
//   client.messages.create({
//     from: twilioPhoneNumber,
//     body: message,
//     to: barberData.phoneNumber
//   })

//   res.sendStatus(200)
// }

// export function resetCronJobs(req, res, next){
//   barberCollection
//   .get()
//   .then(snapshot => {
//       snapshot.docs.forEach(doc => {
//           const barber = doc.id
//           const barberAppointments = (doc.get('appointments') as types.BARBER_APPOINTMENTS[]);
//           barberAppointments.forEach(appointment => {
//               const reminderMessage = UserMessage.generateReminderMessage(
//                 appointment.details.services,
//                 (barber as any),
//                 appointment.details.time.from,
//                 appointment.details.total
//               )
//               console.log(`Creating job for ${barber}\n${appointment.firstName}\nAt - ${appointment.details.time.from}`)
//               createJob(
//                 formatToCronTime(appointment.details.time.from),
//                 appointment.phoneNumber,
//                 reminderMessage
//               )
//           })
//       })
//       res.sendStatus(200)
//   })
// }
// 