import * as twilioLib from '../lib/twilio'
import { DETAILS } from '../lib'
import moment = require('moment');

// store a variable containing if the shop is closed or not.
export const shopIsClosed = () => {
  const currentTime = parseInt(getDate().format('H'))
  return (
    currentTime < parseInt(twilioLib.barberShopAvailablilty.open) ||
    currentTime > parseInt(twilioLib.barberShopAvailablilty.closed)
  )
}

export function phoneNumberFormatter(phoneNumber: string) {
  if (phoneNumber[0] === '+') return phoneNumber.slice(2)
  if (phoneNumber[0] === '1') return phoneNumber.slice(1)
  return phoneNumber
}

export function extractText(body: string): string {
  return String(body.match(/\w+/gi))
}

export function validateMessage(body: string, validResponses: string[]) {
  let extractedNumber
  extractedNumber = body.match(/\d/gi)

  if (!extractedNumber) return false
  extractedNumber = extractedNumber[0]
  return validResponses.includes(extractedNumber)
}

export function extractedNumbers(body: string) {
  var numbers = body.match(/\d+/g).map(Number);
  return numbers
}

export function validateAppointmentDetails(details: DETAILS): { correct: boolean, msg?: string} {
  const errorMessages = {
    invaildDate: 'Date was invaild'
  }
  if(details.time.from === 'Invalid date'){
    return { correct: false, msg: errorMessages.invaildDate }
  }
  else {
    return { correct: true }
  }
}

export function getDate(): moment.Moment {
  const dateWithTimeZone = new Date().toLocaleString('en-US', {
    timeZone: 'America/Mexico_City'
  })
  
  return moment(dateWithTimeZone, 'M/DD/YYYY, h:mm:ss a')
}

// Expects time to be in format yyyy-mm-dd hh-mm
export const formatToCronTime = time => {
  // Date Values for cron job
  const minutes = moment(time).format('m')
  const hour = moment(time).format('H')
  const alertHour = parseInt(hour) - 1
  const dayOfMonth = moment(time).format('D')
  const month = parseInt(moment(time).format('M')) - 1

  return `0 ${minutes} ${alertHour} ${dayOfMonth} ${month} *`
}