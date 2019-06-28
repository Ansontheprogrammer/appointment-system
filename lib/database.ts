import mongoose, { mongo } from 'mongoose'
import config from '../config/config'

const url = config.MONGO_CONNECTION_KEY
process.env.GOOGLE_APPLICATION_CREDENTIALS = './config/credentials.json'

// connecting to mongo and creating schema
mongoose.connect(url, { useNewUrlParser: true }).then(
  () => {
    console.log('connection to database successful')
  },
  err => console.error(err)
)

// *******************SCHEMA DECLARATIONS***************************
const Schema = mongoose.Schema

const customerSchema = new Schema({
  phoneNumber: { type: String, required: true },
  firstName: { type: String, required: false },
  stepNumber: { type: String, required: true },
  barber: String,
  service: [String],
  additionalService: String,
  time: String,
  total: Number,
  completeTextFlow: Boolean,
  creditCard: {
    number: String,
    expiration: String,
    code: String
  }
})

const barberSchema = new Schema({
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  zipCode: { type: String, required: true },
  appointments: {
    phoneNumber: String,
    firstName: String,
    time: String,
    calendar: [{
    }]
  }
})

export const BarberModel = mongoose.model('barber', barberSchema)
export const CustomerModel = mongoose.model('customer', customerSchema)

export type BARBER = {
  phoneNumber: string
  email: string
  firstName: string
  lastName: string
  zipCode: string
  appointments: [
    {
      customer: CUSTOMER
      time: string
    }
  ]
}

export type CUSTOMER = {
  phoneNumber: string
  firstName: string
  stepNumber?: string
}

export class Database {
  public static firstLetterUpperCase(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  public findBarberInDatabase(firstName: string): Promise<mongoose.Document> {
    return new Promise((resolve, reject) => {
      BarberModel.findOne({ firstName }, function (err, doc) {
        if (err) return reject(err)
        if (!doc) return resolve(null)
        else return resolve(doc)
      })
    })
  }

  public findAllBarbers(): Promise<mongoose.Document[]> {
    return new Promise((resolve, reject) => {
      BarberModel.find({}, function (err, docs) {
        if (err) return reject(err)
        if (!docs) return resolve(null)
        else return resolve(docs)
      })
    })
  }

  public updateBarber(firstName: string, update: {}) {
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {

      BarberModel.findOneAndUpdate({ firstName }, update, (err, doc) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public addAppointment(barberFirstName: string, customer: { phoneNumber: string, firstName: string }, time: string) {
    const { phoneNumber, firstName } = customer
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {
      this.findBarberInDatabase(barberFirstName).then(docs => {
        (docs as any)['appointments'] = (docs as any)['appointments'].concat({ firstName, phoneNumber, time })
        docs.save(function (err, updatedDoc) {
          if (err) reject(err);
          resolve(updatedDoc);
        })
      }, reject)
    })
  }

  public createBarber(barberInfo: BARBER) {
    // Assign step number field before saving
    barberInfo = Object.assign(barberInfo, { stepNumber: '1' })
    barberInfo.firstName = Database.firstLetterUpperCase(barberInfo.firstName)
    barberInfo.lastName = Database.firstLetterUpperCase(barberInfo.lastName)
    barberInfo.email = barberInfo.email.toLowerCase()

    return new Promise((resolve, reject) => {
      this.hasPersonSignedUp(barberInfo.firstName).then(hasPersonSignedUp => {
        if (hasPersonSignedUp) return reject('Customer has already signed up.')
        const customer = new BarberModel(barberInfo)

        // saving customer to database
        customer.save(function (err, updatedDoc) {
          if (err) reject(err)
          resolve()
        })
      })
    })
  }

  public findCustomerInDatabase(phoneNumber: string): Promise<mongoose.Document> {
    return new Promise((resolve, reject) => {
      CustomerModel.findOne({ phoneNumber }, function (err, doc) {
        if (err) return reject(err)
        if (!doc) return resolve(null)
        else return resolve(doc)
      })
    })
  }

  public createCustomer(phoneNumber: string): Promise<mongoose.Document> {
    // Assign step number field before saving
    const customerInfo = Object.assign({ phoneNumber }, { stepNumber: '1' })

    return new Promise((resolve, reject) => {
      this.hasPersonSignedUp(customerInfo.phoneNumber).then(
        hasPersonSignedUp => {
          if (hasPersonSignedUp)
            return reject('Customer has already signed up.')

          const customer = new CustomerModel(customerInfo)

          // saving customer to database
          customer.save(function (err, updatedDoc) {
            if (err) reject(err)
            console.log(updatedDoc, 'updated Doc')
            resolve(updatedDoc)
          })
        }
      )
    })
  }

  public updateCustomer(phoneNumber: string, update: {}) {
    // finish check to ensure stock list isn't already created.
    return new Promise((resolve, reject) => {
      CustomerModel.findOneAndUpdate({ phoneNumber }, update, (err, doc) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public hasPersonSignedUp(phoneNumber: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.findBarberInDatabase(phoneNumber).then(user => {
        resolve(!!user)
      }, reject)
    })
  }
}
