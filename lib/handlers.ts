import { Database } from './database'
import { getBarberAppointments } from './twilio'
import { client } from './twilio'
import { createJob } from './cron'
import config from '../config/config'
import moment from 'moment'

const database = new Database()

// export function updateCustomerAccount(req, res, next){
//     /**
//      * @req body = {
//      *  phoneNumber: string,
//      *  prop: "email" | "firstName" | "lastName" | "deals" | "alert" | "zipCode" | "stepNumber",
//      *  value: string
//      * }
//      */
//     const { phoneNumber, prop, value } = req.body;

//     new Database().updateCustomer(phoneNumber, prop, value).then(() => {
//         res.sendStatus(200)
//     }, next)
// }

// export function getCustomerAccount(req, res, next){
//     /**
//      * @req body = {
//      *  phoneNumber: string
//      * }
//      */
//     new Database().findCustomerInDatabase(req.body.phoneNumber).then(customer => {
//         res.json(customer)
//     }, next)
// }

export async function getBarberAvailableTimes(req, res, next) {
    const { barber, datetime, services} = req.body
    /* 
        The same flow as the text flow
        res.json with the barbers available times
        format for getBarberAvailableTimes  - 'YYYY-MM-DD hh:mm'
    */
    
    const barberInDatabase = await (database.findBarberInDatabase(barber) as any)
    const availableTimes = getBarberAppointments(services, barberInDatabase, false)
    
    res.json({ barber, availableTimes })
}

export function bookAppointment(req, res, next) {
    const { barberName, datetime, customerName, phoneNumber, services } = req
    /*    
        Book an appointment based on date and time
        Send a confirmation text
        Set up the chron job
    */

    res.json({ route: 'book appointment' })
}

export async function walkInAppointment(req, res, next) {
    const { barber, customerName, phoneNumber, services } = req.body
    /* 
        Get current date time
        Book an appointment based on current date and time
        Send a confirmation text
        Set up the chron job
    */

    const customer = {
        phoneNumber,
        firstName: customerName
    }

    services.shift()

    let total = 0
    services.forEach(service => total += service.price)

    const barberInDatabase = await (database.findBarberInDatabase(barber) as any)
    const firstAvailableTime = getBarberAppointments(services, barberInDatabase, false)[0]
    const hour24Format = moment(firstAvailableTime, 'hh:mm a').format('HH:mm')
    const hour12Format = moment(firstAvailableTime, 'hh:mm a').format('hh:mm a')
    const confirmationMessage = `Awesome! Here are your appointment details:\n\nService: ${services.map(service => `\n${service.service}`)}\n\nBarber: ${barber}\nTime: ${hour12Format}\nTotal: $${total}`

    database.addAppointment(barber, customer, {
        from: `${moment().format('YYYY-MM-DD')} ${hour24Format}`,
        duration: 60
    }, '2019-08-06')

    console.log('ALERT HOUR', firstAvailableTime.split(':')[0])
    client.messages.create({
        from: config.TWILIO_PHONE_NUMBER,
        body: confirmationMessage,
        to: phoneNumber
    })

    //====== TESTING DATE ======//
    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)
    const minutes = currDate.getMinutes()
    const hour = currDate.getHours()
    //====== TESTING DATE ======//

    createJob(`0 ${minutes + 2} ${hour} 6 7 *`, phoneNumber, confirmationMessage)

    res.sendStatus(200)
}


export function createBarber(req, res, next) {
    /**
     * @req body = {
     * phoneNumber: string
        email: string
        firstName: string
        lastName: string
        zipCode: string
        appointments: [
            {
            customer: CUSTOMER
            time: string
            }
        ]
    * }
     */
    new Database().createBarber(req.body).then(() => {
        res.sendStatus(200)
    }, next)
}
