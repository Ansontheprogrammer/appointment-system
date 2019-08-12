import admin from 'firebase-admin'
import { DocumentData } from '@google-cloud/firestore';
import * as twilioLib from './twilio';

admin.initializeApp({
  credential: admin.credential.cert('./config/firebaseAdminKey.json')
});

let db = admin.firestore();

process.env.GOOGLE_APPLICATION_CREDENTIALS = './config/credentials.json'

export type BARBER = {
  phoneNumber: string
  email: string
  firstName: string
  lastName: string
  zipCode: string
  appointments: [
    twilioLib.BARBER_APPOINTMENTS
  ]
}

export type CUSTOMER = {
  phoneNumber: string
  firstName: string
  stepNumber?: string
}

export type ALLOCATED_TIMES = {
  from: string, 
  duration: number
}

export class Database {
  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  public findBarberInDatabase(firstName: string): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      db.collection('barbers').doc(firstName).get()
        .then((snapshot) => resolve(snapshot.data()))
        .catch(reject);
    })
  }

  public findAllBarbers(): Promise<DocumentData[]> {
    return new Promise((resolve, reject) => {
      db.collection('barbers').get()
        .then((snapshots) => {
          // get an array of SnapShots
          const snapshotData = snapshots.docs.map(snap => snap.data());
          resolve(snapshotData)
        })
        .catch(reject)
    })
  }

  public updateBarber(firstName: string, update: {}) {
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {
      let docRef = db.collection('barbers').doc(firstName)
      docRef.update({ ...update }).then(resolve, reject)
    })
  }

  public async addAppointment(barberFirstName: string, customer: { phoneNumber: string, firstName: string }, time: ALLOCATED_TIMES) {
    const { phoneNumber, firstName } = customer
    const appointment = { phoneNumber, firstName, time }
    let docRef = db.collection('barbers').doc(barberFirstName)
    try {
      let barber = await docRef.get()
      let appointments = barber.get('appointments')
      if (appointments) {
        let newAppointmentsArray = appointments.concat(appointment)
        await docRef.set({ appointments: newAppointmentsArray });
      } else await docRef.set({ appointments: [appointment] })
    } catch (err) {
      throw err
    }

  }

  public createBarber(barberInfo: BARBER) {
    // Assign step number field before saving
    barberInfo = Object.assign(barberInfo, { stepNumber: '1' })
    barberInfo.firstName = Database.firstLetterUpperCase(barberInfo.firstName)
    barberInfo.lastName = Database.firstLetterUpperCase(barberInfo.lastName)
    barberInfo.email = barberInfo.email.toLowerCase()

    return new Promise((resolve, reject) => {
      this.hasPersonSignedUp(true, barberInfo.firstName).then(hasPersonSignedUp => {
        if (!!hasPersonSignedUp) return reject('Barber has already signed up.')
        let docRef = db.collection('barbers').doc(barberInfo.firstName);
        docRef.set({ ...barberInfo }).then(resolve, reject)
      })
    })
  }

  public findCustomerInDatabase(phoneNumber: string): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      db.collection('customers').doc(phoneNumber).get()
        .then((snapshot) => resolve(snapshot.data()))
        .catch(reject);
    })
  }

  public createCustomer(phoneNumber: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Assign step number field before saving
      const customerInfo = Object.assign({ phoneNumber })
      const session = { stepNumber: '1', finishedGeneralSteps: false}

      this.hasPersonSignedUp(false, customerInfo.phoneNumber).then(hasPersonSignedUp => {
        if (!!hasPersonSignedUp) return reject('Customer has already signed up.')

        let docRef = db.collection('customers').doc(customerInfo.phoneNumber);
        docRef.set({ ...customerInfo, session }).then(resolve, reject)
      })
    })
  }

  public updateCustomer(phoneNumber: string, update: {}) {
    return new Promise((resolve, reject) => {
      let docRef = db.collection('customers').doc(phoneNumber)
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
