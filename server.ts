import bodyParser from 'body-parser'
import express from 'express'
import * as twilioLib from './lib/twilio';
import * as databaseHandlers from './lib/databaseHandler'
import * as flow from './config/flow'
import TextAlert from './lib/textAlert';
import cors from 'cors'

export const app = (express)();

export const scheduler = TextAlert.scheduler()

const port = process.env.PORT || 80;

app.use(express.json());       // to support JSON-encoded bodies
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.post('/api/getDeals', databaseHandlers.getDeals)
app.post('/api/getDealsByCategory', databaseHandlers.getDealsByCategory)
app.post('/api/updateDeal', databaseHandlers.updateCustomerAccount)
app.post('/api/createDeal' ,databaseHandlers.createDeal)
app.post('/api/storeCompany', databaseHandlers.storeCompany)
app.post('/api/getCustomerAccount', databaseHandlers.getCustomerAccount)
app.post('/api/updateCustomerAccount', databaseHandlers.updateCustomerAccount)
app.post('/api/customerWelcome', twilioLib.customerWelcome)
app.post('/api/getCustomerFlow', twilioLib.getCustomerFlow, flow.processFlow)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200);
})

app.listen(port, () => {
    console.log('Server is up and running')
    scheduler.schedule()
});