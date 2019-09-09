import bodyParser from 'body-parser'
import express from 'express'
import * as twilioLib from './lib/twilio'
import * as flow from './config/flow'
import cors from 'cors'
import { apps } from 'firebase-admin'

const phoneSystem = new twilioLib.PhoneSystem()
const textSystem = new twilioLib.TextSystem()
const appSystem = new twilioLib.AppSystem()

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
app.post('/api/notifyBarber', appSystem.notifyBarber)
// Text system
app.post('/api/textMessageFlow', textSystem.textMessageFlow, flow.processFlow)
// Database Handlers
app.post('/api/createBarber', twilioLib.createBarber)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log('Server is up and running')
})
