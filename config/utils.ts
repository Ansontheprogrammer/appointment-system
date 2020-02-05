import { DETAILS } from '../lib'
import moment = require('moment');
import { timezone, barberShopAvailability } from '../lib/database';

// store a variable containing if the shop is closed or not.
export const shopIsClosed = (closedNow?: boolean) => {
  if(closedNow) return true
  
  let day;
  if(process.env.NODE_ENV === 'test'){
    day = 'Tuesday'
  } else {
    day = getDate().format('dddd')
  }
  const currentTime = parseInt(getDate().format('H'))
  const shopAvailabilityForTheDay = barberShopAvailability[day.toLowerCase()]
  
  return (
    currentTime < parseInt(shopAvailabilityForTheDay.from) ||
    currentTime > parseInt(shopAvailabilityForTheDay.to)
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

export function extractNumbers(body: string) {
  var numbers = body.match(/\d+/g).map(Number);
  return numbers
}

export function extractNumberFromMessage(body: string) {
  var numbers = body.match(/\d+/g)[0];
  return numbers
}

export function validateAppointmentDetails(details: DETAILS): { correct: boolean, msg?: string} {
  const errorMessages = {
    invaildDate: 'Date was invaild',
    invalidAppointmentDuration: 'No appointment duration was supplied',
    invalidServices: 'No services were supplied',
    invalidTotal: 'No total was supplied'
  }
  // TODO: Add a check to check if the services are corret & make a type for services
  if(details.time.from === 'Invalid date'){
    return { correct: false, msg: errorMessages.invaildDate }
  } else if(!details.time.duration){
    return { correct: false, msg: errorMessages.invalidAppointmentDuration}
  } else if(!details.services.length){
    return { correct: false, msg: errorMessages.invalidServices}
  } else if(!details.total){
    return { correct: false, msg: errorMessages.invalidTotal}
  }
  else {
    return { correct: true }
  }
}

export function getDate(): moment.Moment {
  const dateWithTimeZone = new Date().toLocaleString('en-US', {
    timeZone: timezone
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