const CronJob = require('cron').CronJob
import { client } from './twilio'
import { twilioPhoneNumber, timezone } from './database'
const jobs = {}

export function createJob(date: string, phoneNumber: string, message: string, barberName: string, id: string) {
  // Check to make sure date is not passed ***************
  let job = new CronJob(date, function () {
    client.messages.create({
      from: twilioPhoneNumber,
      body: message,
      to: phoneNumber
    })

    this.stop()
  }, () => onComplete(id, barberName), true, timezone)

  jobs[barberName].push([id, job])
}

export function cancelJob(id: string, barberName: string) {
  jobs[barberName].forEach(job => {
    if(job[0] === id) {
      job[1].stop()
    }
  })
}

function onComplete(id: string, barberName: string) {
  jobs[barberName].forEach((job, i) => {
    if(job[0] === id) {
      jobs[barberName].splice(i, 1)
    }
  })
}