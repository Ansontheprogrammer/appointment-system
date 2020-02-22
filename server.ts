import bodyParser from 'body-parser'
import express from 'express'
import session from 'express-session'
import uuid from 'uuid'
import {PhoneSystem} from './lib/phoneFlow'
import { 
  sendTextMessageBlast, sendNotification, 
} from './lib/twilio'
import { Database, updateCompanyInfo, cancelAppointment, bookAppointment } from './lib/database'
import { getSchedule } from './lib/scheduler'
import cors from 'cors'

const phoneSystem = new PhoneSystem()

export const app = express()

const port = process.env.PORT || 80
const sessionConfig = {
  secret: uuid,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}

export async function setSystemConfigMiddleWare(req: any, res, next){
  try {
    const dbForPath = new Database({
      firstCollection: 'barbershops',
      doc: req.params.barbershop
    })
    req.barberShopInfo = await dbForPath.db.findDataInDocument()
    if(!!req.params.barber){
      req.barberDB = await new Database({
        firstCollection: 'barbershops',
        doc: req.params.barbershop,
        secondCollection: 'barbers'
      })
      req.barber = await req.barberDB.db.findOne('name', req.params.barber)
    }
    
    req.session.clientDB = await new Database({
      firstCollection: 'barbershops',
      doc: req.params.barbershop,
      secondCollection: 'customers'
    })
    return next()
} catch (err) {
  res.send(err).status(400)
}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionConfig.cookie.secure = true // serve secure cookies
}

app.use(express.json()) // to support JSON-encoded bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(cors())
app.use(session(sessionConfig))

app.get('/v1/get/schedule/:barbershop/:barber', setSystemConfigMiddleWare, getSchedule)
app.post('/v1/phone/:barbershop/', setSystemConfigMiddleWare, phoneSystem.phoneFlow)
app.post('/v1/create/appointment/:barbershop/:barber', setSystemConfigMiddleWare, bookAppointment)
app.delete('/v1/delete/appointment/:barbershop/:barber', setSystemConfigMiddleWare, cancelAppointment)
app.put('/v1/update/companyInfo/:barbershop', updateCompanyInfo)
app.post('/v1/send/:barbershop/:barber/:notification/', setSystemConfigMiddleWare, sendNotification)
app.get('/api/ping', (req, res, next) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log('Server is up and running')
  console.log('Setting individual shop data...', '\nCurrent enviroment:',process.env.NODE_ENV)
})