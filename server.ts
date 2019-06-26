import bodyParser from 'body-parser'
import express from 'express'
import * as twilioLib from './lib/twilio';
import * as databaseHandler from './lib/databaseHandler';
import * as flow from './config/flow'

export const app = (express)();

const port = process.env.PORT || 80;

app.use(express.json());       // to support JSON-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// Phone system
app.post('/api/phoneAppointmentFlow', twilioLib.phoneAppointmentFlow)
app.post('/api/bookAppointment', twilioLib.bookAppointment)
app.post('/api/chosenBarber', twilioLib.chosenBarber)
app.post('/api/confirmation', twilioLib.confirmation)
app.post('/api/createBarber', databaseHandler.createBarber)
// Text system
app.post('/api/textMessageFlow', twilioLib.textMessageFlow, flow.processFlow)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200);
})

app.listen(port, () => {
    console.log('Server is up and running')
});