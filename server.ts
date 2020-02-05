import bodyParser from 'body-parser'
import express from 'express'
import {PhoneSystem} from './lib/flow/phoneFlow'
import { TextSystem } from './lib/flow/smsFlow/smsFlow'
import { AppSystem } from './lib/flow/appFlow'
import { 
  createBarber, 
  sendTextMessageBlast, 
  notifyBarberCustomerTriedToCancelWithinTheHour,
  notifyCustomerAboutFeeOnTheirNextVisit,
  cancelAppointment
} from './lib/twilio'
import { Database } from './lib/database'
import * as flow from './config/flow'
import cors from 'cors'
import { TextInterface } from './lib/flow/smsFlow/textInterface'

const phoneSystem = new PhoneSystem()
const textSystem = new TextSystem()
const appSystem = new AppSystem()

export const app = express()

const port = process.env.PORT || 80

app.use(express.json()) // to support JSON-encoded bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(cors())


// Phone system
app.post('/api/phoneAppointmentFlow', phoneSystem.phoneFlow)
// App system
app.post('/api/bookAppointment', appSystem.bookAppointment)
app.post('/api/cancelAppointment', cancelAppointment)
app.post('/api/getBarberAvailableTimes', appSystem.getBarberAvailableTimes)
app.post('/api/walkinAppointment', appSystem.walkInAppointment)
app.post('/api/notifyCustomerAboutFeeOnTheirNextVisit', notifyCustomerAboutFeeOnTheirNextVisit)
// Text blast
app.post('/api/sendTextMessageBlast', sendTextMessageBlast)
// Text system
app.post('/api/textInterface', new TextInterface().userInterface)
app.post('/api/textMessageFlow', textSystem.textMessageFlow, flow.processFlow)
// Database Handlers
app.post('/api/createBarber', createBarber)
// Set Barber Shop Data
app.post('/api/setBarberShopData', Database.setBarberShopData)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log('Server is up and running')
  console.log('Setting individual shop data...', '\nCurrent enviroment:',process.env.NODE_ENV)
  if(process.env.NODE_ENV === 'develop'){
    Database.setBarberShopData({}, {}, {})
  }
})
