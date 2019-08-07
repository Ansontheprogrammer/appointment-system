import { Database } from './database'
import { getBarberAppointmentsTest } from './twilio'
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
    const { barberName, datetime } = req.body
    /* 
        The same flow as the text flow
        res.json with the barbers available times
        format for getBarberAvailableTimes  - 'YYYY-MM-DD hh:mm'
    */

    const barber = await database.findBarberInDatabase(barberName)
    const availableTimes = getBarberAppointmentsTest(req, barber)

    res.json({ barberName, availableTimes })
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
    const { barberName, datetime, customerName, phoneNumber, services = [{
        service: 'Child Haircut',
        price: 15,
        duration: 30,
    }] } = req.body
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

    const barber = await database.findBarberInDatabase(barberName)
    const firstAvailableTime = getBarberAppointmentsTest(req, barber)[0]
    const formattedTime = moment(firstAvailableTime, 'hh:mm a').format('HH:mm')

    database.addAppointment(barberName, customer, {
        from: `${moment().format('YYYY-MM-DD')} ${formattedTime}`,
        duration: 60
    }, '2019-08-06')

    console.log('ALERT HOUR', firstAvailableTime.split(':')[0])

    const message = `Your appointment with ${barberName} is at ${firstAvailableTime}. See you then!`

    client.messages.create({
        from: config.TWILIO_PHONE_NUMBER,
        body: message,
        to: phoneNumber
    })

    //====== TESTING DATE ======//
    let dateWithTimeZone = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    let currDate = new Date(dateWithTimeZone)
    const minutes = currDate.getMinutes()
    const hour = currDate.getHours()
    //====== TESTING DATE ======//

    createJob(`0 ${minutes + 2} ${hour} 6 7 *`, phoneNumber, message)

    res.json({ barberName, firstAvailableTime })
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
