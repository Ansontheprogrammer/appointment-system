import * as utils from '../../config/utils'
import { database, client, UserMessages, sendText } from '../twilio'
import moment from 'moment';
import { BARBER } from '../'
import { createJob } from '../cron'
import { formatToCronTime } from '../../config/utils'
import { twilioPhoneNumber, getBarberAppointments} from '../database'

const UserMessage = new UserMessages()

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

    const confirmationMessage = UserMessage.getConfirmationMessage(
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
    
    let appointmentID;

    try {
      appointmentID = await database.addAppointment(barber, customer, appointmentData)
    } catch(err){
      console.error(err, 'error trying to add appointment')
    }

    // handle if barbershop is closed
    if (utils.shopIsClosed()) {
      return res.send('Barbershop is closed').status(400)
    }

    const reminderMessage = UserMessage.getReminderMessage(
      services,
      barber,
      firstAvailableTime,
      total
    )

    createJob(
      formatToCronTime(firstAvailableTime),
      phoneNumber,
      reminderMessage,
      appointmentID
    )

    res.sendStatus(200)
  }

  public async getBarberAvailableTimes(req, res, next) {
    // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
    const { barber, fromDate, services } = req.body
    // Handle case for retrieving schedules on the dashboard
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

  public async bookAppointment(req, res, next) {
    /* 
      Formats:
        Date - MM-DD-YYYY
        Time - ddd, MMMM Do, h:mm a
    */

    const { barber, date, time, name, services } = req.body
    const phoneNumber = utils.phoneNumberFormatter(req.body.phoneNumber)
    const dateTime = `${date} ${time}`
    const formattedDateTime = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format('YYYY-MM-DD HH:mm')

    let duration = 0, total = 0, appointmentID

    services.forEach(service => (duration += service.duration))
    services.forEach(service => (total += service.price))

    const customerInfo = {
      customerData: { phoneNumber, firstName: name },
      appointmentData: {
        time: { from: formattedDateTime, duration },
        services,
        total
      }
    }
    
    let barberDoc

    try {
      barberDoc = await database.findBarberInDatabase(barber);
      appointmentID = await database.addAppointment(
        barber,
        customerInfo.customerData,
        customerInfo.appointmentData
      )
      
      database.createCustomer(phoneNumber)
    } catch (err){
      return res.send(err).status(500)
    }

    const confirmationMessage = UserMessage.getConfirmationMessage(
      services,
      barber,
      formattedDateTime,
      total,
      true
    )

    const reminderMessage = UserMessage.getReminderMessage(
      services,
      barber,
      formattedDateTime,
      total
    )

    const timeFormat = moment(
      dateTime,
      `MM-DD-YYYY ${UserMessage.friendlyFormat}`
    ).format(UserMessage.friendlyFormat)
    // send confirmation
    sendText(confirmationMessage, phoneNumber)
    sendText(`${customerInfo.customerData.firstName} just made an appointment for ${timeFormat} there phone number is ${phoneNumber}`, '9082097544')

    createJob(
      formatToCronTime(formattedDateTime),
      phoneNumber,
      reminderMessage, 
      appointmentID
    )

    res.sendStatus(200)
  }
}
