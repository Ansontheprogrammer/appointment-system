const CronJob = require('cron').CronJob
import { client } from './twilio'
import { twilioPhoneNumber } from './database'
import config from '../config/config'
const jobs = []

export function createJob(date: string, phoneNumber: string, message: string) {
  let job = new CronJob(date, function () {
    client.messages.create({
      from: twilioPhoneNumber,
      body: message,
      to: phoneNumber
    })

    this.stop()
  }, () => onComplete(date), true, 'America/Mexico_City')

  jobs.push([date, job])
}

export function cancelJob(date) {
  jobs.forEach(job => {
    if(job[0] === date) {
      job[1].stop()
    }
  })
}

function onComplete(date) {
  jobs.forEach((job, i) => {
    if(job[0] === date) {
      jobs.splice(i, 1)
    }
  })
}