import { DETAILS, SERVICES } from '../lib'
import moment = require('moment');


export const friendlyFormat = 'ddd, MMMM Do, h:mm a'

export const getFriendlyTimeFormat = time => {
    return moment(time, 'HH:mm').format('h:mm a')
  }

export function getConfirmationMessage(
    services: SERVICES[],
    barberName: string,
    time: string,
    total: number,
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating confirmation message')
    time = moment(time, 'YYYY-MM-DD HH:mm').format(this.friendlyFormat)
    const message = `Great! Here are your appointment details:\n\nService: ${services.map(
      service => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to view your appointments text (view)`
    return message
  }

export function getReminderMessage(barberName: string) {
  return `REMINDER:\nYour appointment with ${barberName} less than an hour away`
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