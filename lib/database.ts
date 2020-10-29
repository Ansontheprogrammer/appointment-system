import admin from 'firebase-admin'
import * as types from './';
import { validateAppointmentDetails, friendlyFormat, phoneNumberFormatter, getConfirmationMessage, getReminderMessage, formatToCronTime } from '../config/utils';
import uuid from 'uuid'
import { AE_Allision } from 'ae-backend-database'
import { createJob, cancelJob } from './cron';
import moment from 'moment';
import { sendText } from './twilio';


admin.initializeApp({
  credential: admin.credential.cert('./config/firebaseAdminKey.json')
});

export const db = admin.firestore()

export class Database {
  db: AE_Allision
  
  constructor(path){
    if(!!path['secondCollection']){
      
      this.db = new AE_Allision(db, null, {
        firstCollection: path.firstCollection,
        doc: path.doc,
        secondCollection: path.secondCollection
      })
    } else {
      this.db = new AE_Allision(db, null, null, {
        firstCollection: path.firstCollection,
        doc: path.doc
      })
    }
  }
  
  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  // public findBarberInDatabase(firstName: string): Promise<DocumentData> {
  //   return new Promise((resolve, reject) => {
  //     barberCollection
  //     .doc(firstName).get()
  //       .then((snapshot) => resolve(snapshot.data()))
  //       .catch(reject);
  //   })
  // }

  // public findAllBarbers(): Promise<DocumentData[]> {
  //   return new Promise((resolve, reject) => {
  //     barberCollection
  //       .onSnapshot(snapshot => {
  //         snapshot.docs.map(doc => doc.data())
  //       }, reject)
  //   })
  // }

  public async addAppointment(barberFirstName: string, customer: { phoneNumber: string, firstName: string }, details: types.DETAILS): Promise<string | Error> {
    const { phoneNumber, firstName } = customer
    const areAppointmentDetailsCorrect = validateAppointmentDetails(details);

    if (!areAppointmentDetailsCorrect.correct) {
      throw Error(areAppointmentDetailsCorrect.msg)
    }
    
    const appointmentID = uuid.v1()
    const appointment = { phoneNumber, firstName, details, uuid: appointmentID }
    try {
      let barber = await this.db.findOne('name', barberFirstName) as types.BARBER
      const appointments = barber.appointments
      const appointmentAlreadyScheduledForThisTime = !!appointments.find(appointment => appointment.details.time.from === details.time.from)
      if(appointmentAlreadyScheduledForThisTime) throw Error('Appointment already scheduled');
      let newAppointmentsArray = appointments.concat(appointment)
      if(!barber.id) barber.id = barberFirstName
      await this.db.createAndUpdateOne({ ...barber, appointments: newAppointmentsArray });
      // Return appointmentID to use to query list if we have to cancel job.
      return appointmentID
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

// const customerInfo = Object.assign({ phoneNumber, uuid: uuid.v1(), noCallNoShows: [] })
// public createBarber(barberInfo: types.BARBER) {
//   // Assign step number field before saving
//   barberInfo = Object.assign(barberInfo, { appointments: [] })
//   barberInfo.name = Database.firstLetterUpperCase(barberInfo.name)
//   barberInfo.email = barberInfo.email.toLowerCase()
//   return new Promise((resolve, reject) => {
//     this.hasPersonSignedUp(true, barberInfo.name).then(hasPersonSignedUp => {
//       if (!!hasPersonSignedUp) return reject('Barber has already signed up.')
//       let docRef = barberCollection.doc(barberInfo.name);
//       docRef.set({ ...barberInfo }).then(resolve, reject)
//     })
//   })
// }
// public findCustomerInDatabase(phoneNumber: string): Promise<DocumentData> {
//   return new Promise((resolve, reject) => {
//     customerCollection.doc(phoneNumber).get()
//       .then((snapshot) => resolve(snapshot.data()))
//       .catch(reject);
//   })
// }

export async function updateCompanyInfo(req, res){
  const barberShopDoc = new Database({
    firstCollection: 'barbershops',
    doc: req.params.barbershop
  }).db.firebaseDoc
  const data = JSON.parse(JSON.stringify(req.body))
  const barberShopInfo = await (await barberShopDoc.get()).data()
  barberShopDoc.set({...barberShopInfo, ...data})
  res.sendStatus(200)
}

export async function cancelAppointment(req, res, next) {
  const date = moment(req.body.date, 'YYYY-MM-DD HH:mm').format(friendlyFormat)
  let message;
  cancelJob(req.body.appointmentID);
  try {
    await removeAppointmentFromList(req)
  
    // if(didCustomerTryToCancelWithinOneHour) message = `ALERT! \n${name} just tried to cancel within one hour \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.\nThey are not removed out of the system`
    message = `${req.body.clientName} just canceled an appointment for \n${date}. \n\nTheir phone number is ${req.body.phoneNumber} if you would like to contact them.`

    let toPhoneNumber = process.env.NODE_ENV === 'develop' ? '9082097544' : req.barber.phoneNumber
    await sendText(message, toPhoneNumber, req.session.barberShopInfo.twilioNumber)

    res.sendStatus(200)
  } catch (err) {
    return next(err)
  }
}

export async function removeAppointmentFromList(req) {
  const appointmentFilter = appointment => appointment.uuid === req.body.appointmentID
  const appointmentToRemove = req.barber.appointments.find(appointmentFilter)
  const indexOfAppointmentToRemove = req.barber.appointments.indexOf(appointmentToRemove)
  req.barber.appointments.splice(indexOfAppointmentToRemove, indexOfAppointmentToRemove + 1)
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
  await req.barberDB.db.createAndUpdateOne({...req.barber, appointments: req.barber.appointments})
}
export async function bookAppointment(req, res, next) {
    const { date, name, services } = req.body
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber)

    let duration = 0, total = 0, appointmentID

    services.forEach(service => {
      duration += service.duration;
      total += service.price
    })

    const customerInfo = {
      customerData: { phoneNumber, firstName: name },
      appointmentData: {
        time: { from: date, duration },
        services,
        total
      }
    }
    try {
      appointmentID = await req.barberDB.addAppointment(
        req.barber.name,
        customerInfo.customerData,
        customerInfo.appointmentData
      )
      await req.session.clientDB.db.createAndUpdateOne(phoneNumber)
    } catch (err){
      return next(`Error adding appointment \n${err}`)
    }

    const confirmationMessage = getConfirmationMessage(
      services,
      req.barber.name,
      date,
      total,
    )

    const reminderMessage = getReminderMessage(req.barber.name)

    const friendlyAppointmentTimeFormat = moment(
      date,
      `YYYY-MM-DD HH:mm`
    ).format(friendlyFormat)
    // send confirmation
    sendText(confirmationMessage, phoneNumber)
    sendText(`${customerInfo.customerData.firstName} just made an appointment for ${friendlyAppointmentTimeFormat}\nHere is their phone number is ${phoneNumber}`, req.barber.phoneNumber)

    createJob(
      formatToCronTime(date),
      phoneNumber,
      reminderMessage, 
      appointmentID,
      req.session.barberShopInfo.timeZone
    )

    res.json({ appointmentID })
  }
  // export function async walkInAppointment(req, res, next) {
  //   const { barber, name, services } = req.body
  //   const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber)

  //   const customer = {
  //     phoneNumber,
  //     firstName: name
  //   }

  //   if (!Object.keys(services[0]).length) services.shift()

  //   let total = 0
  //   services.forEach(service => (total += service.price))

  //   let duration = 0
  //   services.forEach(service => (duration += service.duration))

  //   const barberInDatabase = await (database.findBarberInDatabase(
  //     barber
  //   ) as any)

  //   const firstAvailableTime = getBarberAppointments(
  //     services,
  //     barberInDatabase
  //   )[0]


  //   if (!firstAvailableTime) {
  //     // This barber is booked up for the day or shop is closed
  //     return res.sendStatus(400)
  //   }

  //   const confirmationMessage = UserMessage.generateConfirmationMessage(
  //     services,
  //     barber,
  //     firstAvailableTime,
  //     total,
  //     true
  //   )

  //   client.messages.create({
  //     from: twilioPhoneNumber,
  //     body: confirmationMessage,
  //     to: phoneNumber
  //   })

  //   const time = { from: firstAvailableTime, duration }

  //   const appointmentData = {
  //     time,
  //     services,
  //     total
  //   }

  //   try {
  //     await database.addAppointment(barber, customer, appointmentData)
  //   } catch(err){
  //     console.error(err, 'error trying to add appointment')
  //   }

  //   // handle if barbershop is closed
  //   if (utils.shopIsClosed()) {
  //     return res.send('Barbershop is closed').status(400)
  //   }

  //   const reminderMessage = UserMessage.generateReminderMessage(
  //     services,
  //     barber,
  //     firstAvailableTime,
  //     total
  //   )

  //   createJob(
  //     formatToCronTime(firstAvailableTime),
  //     phoneNumber,
  //     reminderMessage
  //   )

  //   res.sendStatus(200)
  // }