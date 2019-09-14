import bodyParser from 'body-parser'
import express from 'express'
import PhoneSystem from './lib/flow/phoneFlow'
import { TextSystem } from './lib/flow/smsFlow'
import { AppSystem } from './lib/flow/appFlow'
import { createBarber, notifyBarber } from './lib/twilio'

import * as flow from './config/flow'
import cors from 'cors'

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
app.post('/api/phoneAppointmentFlow', phoneSystem.phoneAppointmentFlow)
app.post('/api/chooseService', phoneSystem.chooseService)
app.post('/api/chosenBarber', phoneSystem.chosenBarber)
app.post('/api/confirmation', phoneSystem.confirmation)
// App system
app.post('/api/bookAppointment', appSystem.bookAppointment)
app.post('/api/getBarberAvailableTimes', appSystem.getBarberAvailableTimes)
app.post('/api/walkinAppointment', appSystem.walkInAppointment)
app.post('/api/notifyBarber', notifyBarber)
// Text system
app.post('/api/textMessageFlow', textSystem.textMessageFlow, flow.processFlow)
// Database Handlers
app.post('/api/createBarber', createBarber)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log('Server is up and running')
})
