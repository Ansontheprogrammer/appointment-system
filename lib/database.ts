import admin from 'firebase-admin'
import { DocumentData } from '@google-cloud/firestore';
import * as types from './';
import uuid from 'uuid/v1'
import { validateAppointmentDetails } from '../config/utils';

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
  barberShopAvailability,
  friendlyShopName,
  automatedVoice,
  twilioPhoneNumber,
  barberShopPhoneNumber

export class Database {
  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  public static setBarberShopData(req, res, next){
    const { barberShopName, url, shopAvailability, friendlyName, phoneVoice, twilioNumber, shopPhoneNumber } = req.body
    const barberShopDoc = db
    .collection('barbershops')
    .doc(barberShopName)
    
    // SET collections
    barberCollection = barberShopDoc.collection('barbers')
    customerCollection = barberShopDoc.collection('customers')
    // SET service list
    serviceList = JSON.parse(req.body.serviceList)

    // SET barbershop availability
    /* *** Must be lowercase
       wednesday : {
            from: '10',
            to: '18',
      },
    */
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
    barberShopPhoneNumber = 

    // SET barbers in shop
    Database.setBarbersInShop(barberCollection)
    res.sendStatus(200)
  }

  public static setBarbersInShop = (barberShopDoc: FirebaseFirestore.CollectionReference) => {
    barberShopDoc
    .get()
    .then(snapshot => {
      const barberData = snapshot.docs.map(doc => doc.id)
      barbersInShop = barberData
    })
  }

  public findBarberInDatabase(firstName: string): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      barberCollection
      .doc(firstName).get()
        .then((snapshot) => resolve(snapshot.data()))
        .catch(reject);
    })
  }

  public findAllBarbers(): Promise<DocumentData[]> {
    return new Promise((resolve, reject) => {
      barberCollection
        .onSnapshot(snapshot => {
          snapshot.docs.map(doc => doc.data())
        }, reject)
    })
  }

  public updateBarber(firstName: string, update: {}) {
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {
      let docRef = barberCollection.doc(firstName)
      docRef.update({ ...update }).then(resolve, reject)
    })
  }

  public async addAppointment(barberFirstName: string, customer: { phoneNumber: string, firstName: string }, details: types.DETAILS) {
    const { phoneNumber, firstName } = customer
    const areAppointmentDetailsCorrect = validateAppointmentDetails(details);

    if(!areAppointmentDetailsCorrect.correct){
      throw Error(areAppointmentDetailsCorrect.msg)
    }
    
    const appointment = { phoneNumber, firstName, details, uuid: uuid() }
    
    try {
      let docRef = await barberCollection.doc(barberFirstName)
      let barber = await docRef.get()
      let appointments = await barber.get('appointments')
      if (appointments) {
        let newAppointmentsArray = appointments.concat(appointment)
        await docRef.update({ appointments: newAppointmentsArray });
      } else await docRef.update({ appointments: [appointment] })
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
