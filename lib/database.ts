import admin from 'firebase-admin'
import { DocumentData } from '@google-cloud/firestore';
import * as types from './';
import uuid from 'uuid/v1';
import developmentData from '../script/sampleData'
import { validateAppointmentDetails } from '../config/utils';
import { Scheduler, TimeAvailability } from '@ssense/sscheduler';
import moment from 'moment';

const scheduler = new Scheduler()

admin.initializeApp({
  credential: admin.credential.cert('./config/firebaseAdminKey.json')
});

export const db = admin.firestore();

// subscribe to barbers
export let barbersInShop = [];

export const barberShopName = ''
export let 
  barberCollection, 
  customerCollection, 
  serviceList, 
  barberShopURL,
  barberShopAvailability: types.BARBER_AVAILBILITY,
  friendlyShopName,
  automatedVoice,
  twilioPhoneNumber,
  barberShopPhoneNumber,
  timezone

  export function getAvailableTimes(
    duration: number,
    interval: number,
    allocatedTimes: types.ALLOCATED_TIMES[],
    from: string,
    to: string,
    barber: types.BARBER
  ): TimeAvailability[] {
    // set time to get available times
    return scheduler.getIntersection({
      from,
      to,
      duration,
      interval,
      schedules: [
        {
          ...barberShopAvailability,
          unavailability: [
            {
              from: `${from} ${barber.unavailabilities.lunch.from}`,
              to: `${from} ${barber.unavailabilities.lunch.to}}`
            },
            ...barber.unavailabilities.offDays,
            ...barber.unavailabilities.unavailableTimes,
            ...barber.unavailabilities.vacations
          ],
          allocated: allocatedTimes
        }
      ]
    })[from]
  }
  
  type SPECIFIC_TIME = {
    time: string,
    duration: number
  }
  export function getBarberAppointments(
    services: types.SERVICES[],
    barber: types.BARBER,
    date?: string,
    specificTime?: SPECIFIC_TIME
  ): any {
    const currentDateAndTime = moment()
    let from = currentDateAndTime.format('YYYY-MM-DD')
  
    if (!!date) from = moment(date).format('YYYY-MM-DD')
  
    let to = moment(from)
      .add(1, 'day')
      .format('YYYY-MM-DD')

    
    const barbersAllocatedTimes = barber.appointments.map(
      appointment => appointment.details.time
    )
    let totalDuration = 0
    // sum up total durations
    services.forEach(service => (totalDuration += service.duration))
    // TODO: think of a way to architect it to provide different features per shop
    // FADESOFGRAY - if customer didn't just order a hair lining, lets change interval to 30
    let interval;
    interval = 30;
  
    let availableTimes = getAvailableTimes(
      totalDuration,
      interval,
      barbersAllocatedTimes,
      from,
      to,
      barber
    )
    
    if (!availableTimes) return []
    // if(!!specificTime) {
    //   const time = moment(specificTime.time, 'YYYY-MM-DD HH:mm').format('HH:mm')
    //   return queryAllocatedTimes(availableTimes, time)
    // }
    return formatAllocatedTimes(availableTimes).map(time =>
      moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm')
    )
  }
  
  export function formatAllocatedTimes(
    barbersAllocatedTimes: TimeAvailability[]
  ) {
    return barbersAllocatedTimes
      .filter(availability => availability.available)
      .map(availability => moment(availability.time, 'HH:mm').format('h:mm a'))
  }

  // export function queryAllocatedTimes(
  //   barbersAllocatedTimes: TimeAvailability[],
  //   time: string
  // ) {
  //   return barbersAllocatedTimes
  //     .filter(availability => availability.time === time)[0].available
  // }

  
export class Database {
  constructor(){}
  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  public static setBarberShopData(req, res, next){
    if(process.env.NODE_ENV === 'develop'){
      req.body = developmentData
    }

    const { barberShopName, url, shopAvailability, friendlyName, phoneVoice, twilioNumber, shopPhoneNumber, timeZone } = req.body
    const barberShopDoc = db
    .collection('barbershops')
    .doc(barberShopName)
    
    // SET collections
    barberCollection = barberShopDoc.collection('barbers')
    customerCollection = barberShopDoc.collection('customers')
    // SET service list
    serviceList = JSON.parse(req.body.serviceList)

    // SET barbershop availability
    barberShopAvailability = JSON.parse(shopAvailability)

    // SET barbershop web url
    barberShopURL = url
    
    // SET friendly shop name
    friendlyShopName = friendlyName

    // SET phone automated voice
    automatedVoice = phoneVoice

    // SET phone twilio number
    twilioPhoneNumber = twilioNumber
    
    // SET phone twilio number
    barberShopPhoneNumber = shopPhoneNumber

    // SET barbers in shop
    Database.setBarbersInShop(barberCollection)

    if(!timeZone) {
      timezone = 'America/Chicago'
    } else {
      timezone = timeZone
    }

    // resetCronJobs();
    if(process.env.NODE_ENV !== 'develop'){
      res.sendStatus(200)
    }
  }

  public static setBarbersInShop = (barberShopDoc: FirebaseFirestore.CollectionReference) => {
    barberShopDoc
    .get()
    .then(snapshot => {
      const barberData = snapshot.docs.map(doc => doc.id)
      barbersInShop = barberData
    })
  }

  public findBarberInDatabase(firstName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      barberCollection
      .doc(firstName)
        .get()
        .then((snapshot) => resolve(snapshot.data()))
        .catch(reject);
    })
  }

  public updateBarber(firstName: string, update: {}) {
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {
      let docRef = barberCollection.doc(firstName)
      docRef.update({ ...update }).then(resolve, reject)
    })
  }

  public async addAppointment(barberFirstName: string, customer: { phoneNumber: string, firstName: string }, details: types.DETAILS): Promise<string | Error> {
    const { phoneNumber, firstName } = customer
    const areAppointmentDetailsCorrect = validateAppointmentDetails(details);
  
    if(!areAppointmentDetailsCorrect.correct){
      throw Error(areAppointmentDetailsCorrect.msg)
    }
    
    const appointmentID = uuid()

    const appointment = { phoneNumber, firstName, details, uuid: appointmentID }
    try {
      let docRef = await barberCollection.doc(barberFirstName)
      let barber = await docRef.get()
      let appointments = await barber.get('appointments')
      if (appointments) {
        // TODO re query database and find out if this appointment time is available
        const appointmentAlreadyScheduledForThisTime = !!appointments.find(appointment => appointment.details.time.from === details.time.from)
        if(appointmentAlreadyScheduledForThisTime) throw Error('Appointment already scheduled');
        let newAppointmentsArray = appointments.concat(appointment)
        if(process.env.NODE_ENV !== 'develop') {
          // avoid saving to test database
          await docRef.update({ appointments: newAppointmentsArray });
        }
      }
      // Return appointmentID to use to query list if we have to cancel job.
      return appointmentID
    } catch (err) {
      throw err
    }
  }

  public createBarber(barberInfo: types.BARBER) {
    // Assign step number field before saving
    barberInfo = Object.assign(barberInfo, { appointments: [] })
    barberInfo.name = Database.firstLetterUpperCase(barberInfo.name)
    barberInfo.email = barberInfo.email.toLowerCase()
    return new Promise((resolve, reject) => {
      this.hasPersonSignedUp(true, barberInfo.name).then(hasPersonSignedUp => {
        if (!!hasPersonSignedUp) return reject('Barber has already signed up.')
        let docRef = barberCollection.doc(barberInfo.name);
        docRef.set({ ...barberInfo }).then(resolve, reject)
      })
    })
  }

  public findCustomerInDatabase(phoneNumber: string): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      customerCollection.doc(phoneNumber).get()
        .then((snapshot) => resolve(snapshot.data()))
        .catch(reject);
    })
  }

  public createCustomer(phoneNumber: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Assign step number field before saving
      const customerInfo = Object.assign({ phoneNumber, uuid: uuid() })
      const session = { stepNumber: '1', finishedGeneralSteps: false}

      this.hasPersonSignedUp(false, customerInfo.phoneNumber).then(hasPersonSignedUp => {
        if (!!hasPersonSignedUp) return reject('Customer has already signed up.')

        let docRef = customerCollection.doc(customerInfo.phoneNumber);
        docRef.set({ ...customerInfo, session }).then(resolve, reject)
      })
    })
  }

  public updateCustomer(phoneNumber: string, update: {}) {
    return new Promise((resolve, reject) => {
      let docRef = customerCollection.doc(phoneNumber)
      docRef.update({ ...update }).then(resolve, reject)
    })
  }

  private hasPersonSignedUp(barber: boolean, phoneNumber: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (barber) this.findBarberInDatabase(phoneNumber).then(resolve, reject)
      else this.findCustomerInDatabase(phoneNumber).then(resolve, reject)
    })
  }
}