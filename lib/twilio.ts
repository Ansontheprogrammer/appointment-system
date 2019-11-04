import config from '../config/config'
import twilio from 'twilio'
import {
  Database,
  barbersInShop,
  serviceList,
  barberShopURL,
  barberShopAvailability,
  twilioPhoneNumber
} from './database'
import * as types from './'
import { Scheduler, TimeAvailability } from '@ssense/sscheduler'
import moment from 'moment'
import { shopIsClosed } from '../config/utils';
export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()
const scheduler = new Scheduler()

export function getAvailableTimes(
  duration: number,
  interval: number,
  allocatedTimes: types.ALLOCATED_TIMES[],
  from: string,
  to: string,
  barber: types.BARBER
): TimeAvailability[] {
  // set time to get available times
  return scheduler.getIntersection({
    from,
    to,
    duration,
    interval,
    schedules: [
      {
        ...barberShopAvailability,
        unavailability: [
          {
            from: `${from} ${barber.unavailabilities.lunch.from}`,
            to: `${from} ${barber.unavailabilities.lunch.to}}`
          },
          ...barber.unavailabilities.offDays,
          ...barber.unavailabilities.unavailableTimes,
          ...barber.unavailabilities.vacations
        ],
        allocated: allocatedTimes
      }
    ]
  })[from]
}

export function getBarberAppointments(
  services: types.SERVICES[],
  barber: types.BARBER,
  date?: string
): string[] {
  const currentDateAndTime = moment()
  let from = currentDateAndTime.format('YYYY-MM-DD')
  // check if barbershop is closed and move the user to make an appointment for the next day
  // if (
  //   shopIsClosed()
  // ) {
  //   from = moment(from)
  //     .add(1, 'day')
  //     .format('YYYY-MM-DD')
  // }

  if (!!date) from = moment(date).format('YYYY-MM-DD')

  let to = moment(from)
    .add(1, 'day')
    .format('YYYY-MM-DD')

  const barbersAllocatedTimes = barber.appointments.map(
    appointment => appointment.details.time
  )
  let totalDuration = 0
  // sum up total durations
  services.forEach(service => (totalDuration += service.duration))
  let availableTimes = getAvailableTimes(
    totalDuration,
    15,
    barbersAllocatedTimes,
    from,
    to,
    barber
  )
  if (!availableTimes) return []
  return formatAllocatedTimes(availableTimes).map(time =>
    moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format('YYYY-MM-DD HH:mm')
  )
}

export function formatAllocatedTimes(
  barbersAllocatedTimes: TimeAvailability[]
) {
  return barbersAllocatedTimes
    .filter(availability => availability.available)
    .map(availability => moment(availability.time, 'HH:mm').format('h:mm a'))
}

export function createBarber(req, res, next) {
  /**
   * @req body = BARBER
   */
  new Database().createBarber(req.body as types.BARBER).then(() => {
    res.sendStatus(200)
  }, next)
}

export function sendshopIsClosedMessage(phoneNumber, res?) {
  client.messages.create({
    from: twilioPhoneNumber,
    body: 'The shop is currently closed\n',
    to: phoneNumber
  })
  sendBookLaterDateLink(phoneNumber)
}

export class UserMessageInterface {
  agreeWords = [
    'Great',
    'Thanks',
    'Fantastic',
    'Awesome',
    'Amazing',
    'Sweet',
    'Okay',
    'Phenomenal'
  ]
  introGreetingWords = ['How you doing', 'How you been', 'Long time no see']
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`
  friendlyFormat = 'ddd, MMMM Do, h:mm a'

  public generateRandomAgreeWord = () =>
    this.agreeWords[Math.floor(Math.random() * this.agreeWords.length)]
  public generateRandomGreeting = () =>
    this.introGreetingWords[
    Math.floor(Math.random() * this.introGreetingWords.length)
    ]

  public generateConfirmationMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number,
    noConfirmation: boolean
  ) {
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating confirmation message')
    time = moment(time, 'YYYY-MM-DD HH:mm').format(this.friendlyFormat)
    const message = `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      service => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}\nIf you would like to cancel this appointment text (remove)`
    if (noConfirmation) return message
    else
      return message.concat(
        '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
      )
  }

  public generateReminderMessage(
    services: types.SERVICES[],
    barberName: string,
    time: string,
    total: number
  ) {

    if (!services.length || !barberName || !time || !total) {
      throw Error('ERR - error creating reminder message')
    }

    time = moment(time, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do, h:mm a')
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
      service => `\n${service.service}`
    )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
  }

  public generateAvailableServicesMessage() {
    let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`

    for (let prop in serviceList) {
      message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
    }
    return message
  }

  public generateGetBarberAvailableTimesMessage(barberSchedule: string[]) {
    return `Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public generateErrorValidatingAppointmentTime(barberSchedule: string[]) {
    return `You must choose a valid response. Here are their available times\nPress:${barberSchedule.map(
      (slot, i) => `\n\n(${i + 1}) \n${slot}`
    )}`
  }

  public generateChooseBarberMessage() {
    return `Which barber would you like today? Press: \n${barbersInShop.map(
      (barber, index) => `\n(${index + 1}) for ${barber}`
    )}`
  }

  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
}

export const UserMessage = new UserMessageInterface()

export async function cancelRecentAppointment(req, res) {
  const { phoneNumber, uuid } = req.customer
  const url = `${barberShopURL}/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
  const message = `Here's a link to cancel your appointment \n${url}`
  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: phoneNumber
  })
}

export async function sendBookLaterDateLink(phoneNumber: string) {
  const url = `${barberShopURL}/cue`
  const message = `Here's a link to book at a later date ${url}`
  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: phoneNumber
  })
}

export async function notifyBarber(req, res, next) {
  const { customer, barberName } = req.body
  const { phoneNumber, name } = customer
  let date = customer.date
  date = moment(date, 'YYYY-MM-DD HH:mm').format(UserMessage.friendlyFormat)
  const message = `${name} just canceled an appointment for \n${date}. \n\nTheir phone number is ${phoneNumber} if you would like to contact them.`
  const barberData = await database.findBarberInDatabase(barberName)

  
  client.messages.create({
    from: twilioPhoneNumber,
    body: message,
    to: barberData.phoneNumber
  })
  res.sendStatus(200)
}

