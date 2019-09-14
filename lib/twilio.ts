import config from '../config/config'
import twilio from 'twilio'
import {
  Database,
  barbersInShop
} from './database'
import { serviceList } from './shopData'
import * as types from './'
import { Scheduler, TimeAvailability } from '@ssense/sscheduler'
import moment from 'moment'

export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse
export const database = new Database()
const scheduler = new Scheduler()

const barberShopAvailablilty = {
  open: '10',
  closed: '19',
  daysClosed: {
    // formatted for datetime object
    Monday: {
      index: 1,
      nextAvailableDay: 1
    },
    Sunday: {
      index: 0,
      nextAvailableDay: 2
    }
  }
}

export function createBarber(req, res, next) {
  /**
   * @req body = BARBER
   */
  new Database().createBarber(req.body as types.BARBER).then(() => {
    res.sendStatus(200)
  }, next)
}

export function sendShopIsClosedMessage(phoneNumber, res) {
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: 'The shop is currently closed\n',
    to: phoneNumber
  })
  sendBookLaterDateLink(phoneNumber)
}

class UserMessageInterface {
  agreeWords = [
    'Great',
    'Thanks',
    'Fantastic',
    'Awesome',
    'Amazing',
    'Sweet',
    'Okay',
    'Phenominal'
  ]
  introGreetingWords = ['How you doing', 'How you been', 'Long time no see']
  confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`
  chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`
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
    time = moment(time, 'YYYY-MM-DD HH-mm').format(this.friendlyFormat)
    const message = `${this.generateRandomAgreeWord()}! Here are your appointment details:\n\nService: ${services.map(
      service => `\n${service.service}`
    )}\n\nBarber: ${barberName}\nTime: \n${time}\nTotal: $${total}`
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
    if (!services.length || !barberName || !time || !total)
      throw Error('ERR - error creating reminder message')
    time = moment(time, 'YYYY-MM-DD HH-mm').format('dddd, MMMM Do, h:mm a')
    return `REMINDER:\nYour appointment is less than an hour away.\nService: ${services.map(
      service => `\n${service.service}`
    )} \n\nBarber: ${barberName}\nTime: ${time}\nTotal: $${total}`
  }

  public generateAvailableServicesMessage() {
    let message = `What type of service would you like today? \n\nPress multiple numbers for multiple services`

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

  errorConfirmingAppointment = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) for first available appointment time\n(2) to book an appointment for today\n(3) for later date`
  errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
}

export const UserMessage = new UserMessageInterface()

export async function cancelRecentAppointment(req, res) {
  const { phoneNumber, uuid } = req.customer
  const url = `eclipperz.netlify.com/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
  const message = `Here's a link to cancel your appointment \n${url}`
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: message,
    to: phoneNumber
  })
}

export async function sendBookLaterDateLink(phoneNumber: string) {
  const url = `https://eclipperz.netlify.com/cue`
  const message = `Here's a link to book at a later date ${url}`
  client.messages.create({
    from: config.TWILIO_PHONE_NUMBER,
    body: message,
    to: phoneNumber
  })
}
