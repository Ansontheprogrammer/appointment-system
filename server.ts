import bodyParser from 'body-parser'
import express from 'express'
import {PhoneSystem} from './lib/flow/phoneFlow'
import { TextSystem } from './lib/flow/smsFlow/smsFlow'
import { AppSystem } from './lib/flow/appFlow'
import { 
  createBarber, 
  notifyBarber, 
  resetCronJobs, 
  sendTextMessageBlast, 
  notifyBarberCustomerTriedToCancelWithinTheHour,
  notifyCustomerAboutFeeOnTheirNextVisit
} from './lib/twilio'
import { Database } from './lib/database'
import * as flow from './config/flow'
import cors from 'cors'
import { exec }  from 'child_process'
import { TextInterface } from './lib/flow/smsFlow/textInterface'

const phoneSystem = new PhoneSystem()
const textSystem = new TextSystem()
const appSystem = new AppSystem()
const textInterface = new TextInterface();

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
app.post('/api/cancelAppointment', appSystem.cancelAppointment)
app.post('/api/getBarberAvailableTimes', appSystem.getBarberAvailableTimes)
app.post('/api/walkinAppointment', appSystem.walkInAppointment)
// No call no show
app.post('/api/notifyBarber', notifyBarber)
app.post('/api/notifyBarberCustomerTriedToCancelWithinTheHour', notifyBarberCustomerTriedToCancelWithinTheHour)
app.post('/api/notifyCustomerAboutFeeOnTheirNextVisit', notifyCustomerAboutFeeOnTheirNextVisit)
// Text blast
app.post('/api/sendTextMessageBlast', sendTextMessageBlast)
// Text system
app.post('/api/textInterface', textInterface.userInterface)
app.post('/api/textMessageFlow', textSystem.textMessageFlow, flow.processFlow)
// Database Handlers
app.post('/api/createBarber', createBarber)
// Set Barber Shop Data
app.post('/api/setBarberShopData', Database.setBarberShopData)
// Reset server cron jobs
app.get('/api/resetCronJobs', resetCronJobs)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log('Server is up and running')
  console.log('Setting individual shop data...', '\nCurrent enviroment:',process.env.NODE_ENV)
  if(process.env.NODE_ENV === 'development'){
    exec('npm run set', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        process.exit()
        return;
      }
      console.log('Finished submitting shop data')
    });
  }
  
})
