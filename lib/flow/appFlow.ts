import * as utils from '../../config/utils'
import { database, getBarberAppointments, UserMessage, client } from '../twilio'
import moment from 'moment';
import { BARBER } from '../'
import { createJob } from '../cron'
import { formatToCronTime } from '../../config/utils'
import { twilioPhoneNumber, barbersInShop, barberShopName, friendlyShopName } from '../database'

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
      // This barber is booked up for the day or shop is closed
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
      from: twilioPhoneNumber,
      body: confirmationMessage,
      to: phoneNumber
    })

    const time = { from: firstAvailableTime, duration }

    const appointmentData = {
      time,
      services,
      total
    }

    try {
      await database.addAppointment(barber, customer, appointmentData)
    } catch(err){
      console.error(err, 'error trying to add appointment')
    }

    // handle if barbershop is closed
    if (utils.shopIsClosed()) {
      return res.send('Barbershop is closed').status(400)
    }

    const reminderMessage = UserMessage.generateReminderMessage(
      services,
      barber,
      firstAvailableTime,
      total
    )

    createJob(
      formatToCronTime(firstAvailableTime),
      phoneNumber,
      reminderMessage
    )

    res.sendStatus(200)
  }

  public async getBarberAvailableTimes(req, res, next) {
    // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
    const { barber, fromDate, services } = req.body
    // Handle case for retrieving schedules on the dashboard
    if(services.length){
      if (!Object.keys(services[0]).length) services.shift()
    }
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

    const dateTime = `${date} ${time}`
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
    ).catch(err => 'App Flow - could not add customer appointment')
    
    database.createCustomer(phoneNumber).catch(err => 'App Flow - could not create customer')

    // send confirmation
    const confirmationMessage = UserMessage.generateConfirmationMessage(
      services,
      barber,
      formattedDateTime,
      total,
      true
    )

    client.messages.create({
      from: twilioPhoneNumber,
      body: confirmationMessage,
      to: phoneNumber
    })


    const reminderMessage = UserMessage.generateReminderMessage(
      services,
      barber,
      formattedDateTime,
      total
    )

    createJob(
      formatToCronTime(formattedDateTime),
      phoneNumber,
      reminderMessage
    )

    res.sendStatus(200)
  }
}
