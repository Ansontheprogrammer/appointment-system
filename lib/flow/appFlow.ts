import * as utils from '../utils'
import { database, getBarberAppointments, UserMessage, client} from '../twilio'
import { barberShopAvailablilty } from '../twilio'
import config from '../../config/config'
import moment from 'moment';
import { BARBER } from '../'
import { createJob } from '../cron'

export class AppSystem {
    public async walkInAppointment(req, res, next) {
      const { barber, name, services } = req.body
      const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber)
  
      const customer = {
        phoneNumber,
        firstName: name
      }
  
      if (!Object.keys(services[0]).length) services.shift()
  
      let total = 0
      services.forEach(service => (total += service.price))
  
      let duration = 0
      services.forEach(service => (duration += service.duration))
  
      const barberInDatabase = await (database.findBarberInDatabase(
        barber
      ) as any)
      const firstAvailableTime = getBarberAppointments(
        services,
        barberInDatabase
      )[0]
  
      if (!firstAvailableTime) {
        // This barber is booked up for the day
        return res.sendStatus(400)
      }
  
      const confirmationMessage = UserMessage.generateConfirmationMessage(
        services,
        barber,
        firstAvailableTime,
        total,
        true
      )
  
      client.messages.create({
        from: config.TWILIO_PHONE_NUMBER,
        body: confirmationMessage,
        to: phoneNumber
      })
  
      const time = { from: firstAvailableTime, duration }
      const appointmentData = {
        time,
        services,
        total
      }
  
      await database.addAppointment(barber, customer, appointmentData)
      const dateWithTimeZone = new Date().toLocaleString('en-US', {
        timeZone: 'America/Mexico_City'
      })
      const currDate = new Date(dateWithTimeZone)
      const currentHour = moment().format('H')
      let date = currDate.getDate()
  
      // handle if barbershop is closed
      if (parseInt(currentHour) > parseInt(barberShopAvailablilty.closed)) {
        return res.send('Barbershop is closed').status(400)
      }
  
      const minutes = moment(firstAvailableTime, 'HH:mm').format('m')
      const alertHour = currentHour.includes('pm')
        ? parseInt(currentHour) + 12
        : parseInt(currentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(
        services,
        barber,
        firstAvailableTime,
        total
      )
      createJob(
        `0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`,
        phoneNumber,
        reminderMessage
      )
  
      res.sendStatus(200)
    }
  
    public async notifyBarber(req, res, next) {
      const { client, phoneNumber, barberName } = req.body
  
      const barberData = await database.findBarberInDatabase(barberName)
  
      // TODO: Add barber phone number to db
      res.send({ client, phoneNumber, barberName })
    }
  
    public async getBarberAvailableTimes(req, res, next) {
      // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
      const { barber, fromDate, services } = req.body
      if (!Object.keys(services[0]).length) services.shift()
      const barberInDatabase = await (database.findBarberInDatabase(
        barber
      ) as Promise<BARBER>)
      let availableTimes = getBarberAppointments(
        services,
        barberInDatabase,
        fromDate
      )
      availableTimes = availableTimes.map(time =>
        moment(time, 'YYYY-MM-DD HH:mm').format(UserMessage.friendlyFormat)
      )
      res.json({ availableTimes })
    }
  
    public bookAppointment(req, res, next) {
      /* 
        Formats:
          Date - MM-DD-YYYY
          Time - ddd, MMMM Do, h:mm a
      */
  
      const { barber, date, time, name, services } = req.body
      const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber)
      // remove first element if empty
      if (!Object.keys(services[0]).length) services.shift()
      const dayOfMonth = moment(date, 'MM-DD-YYYY').format('DD')
      const month = moment(date, 'MM-DD-YYYY').format('MM')
      const dateTime = `${date} ${time}`
      // format dateTime to set appointment and receive confirmation message
      const formattedDateTime = moment(
        dateTime,
        `MM-DD-YYYY ${UserMessage.friendlyFormat}`
      ).format('YYYY-MM-DD HH:mm')
  
      let duration = 0
      services.forEach(service => (duration += service.duration))
  
      let total = 0
      services.forEach(service => (total += service.price))
  
      const customerInfo = {
        customerData: { phoneNumber, firstName: name },
        appointmentData: {
          time: { from: formattedDateTime, duration },
          services,
          total
        }
      }
  
      database.addAppointment(
        barber,
        customerInfo.customerData,
        customerInfo.appointmentData
      )
  
      // send confirmation
      const confirmationMessage = UserMessage.generateConfirmationMessage(
        services,
        barber,
        formattedDateTime,
        total,
        true
      )
  
      client.messages.create({
        from: config.TWILIO_PHONE_NUMBER,
        body: confirmationMessage,
        to: phoneNumber
      })
  
      const minutes = moment(
        dateTime,
        `MM-DD-YYYY ${UserMessage.friendlyFormat}`
      ).format('mm')
      const appointmentHour = moment(
        dateTime,
        `MM-DD-YYYY ${UserMessage.friendlyFormat}`
      ).format('H')
      const alertHour = parseInt(appointmentHour) - 1
      const reminderMessage = UserMessage.generateReminderMessage(
        services,
        barber,
        dateTime,
        total
      )
      createJob(
        `0 ${minutes} ${alertHour} ${dayOfMonth} ${month} *`,
        phoneNumber,
        reminderMessage
      )
  
      res.sendStatus(200)
    }
  }
  