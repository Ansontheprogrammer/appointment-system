const CronJob = require('cron').CronJob
import { client } from './twilio'
import config from '../config/config'
const jobs = []

export function createJob(date: string, phoneNumber: string, message: string) {
  console.log(`[CLEANUP] job ${date} created`)
  let job = new CronJob(date, function () {
    console.log(`[CRON] running job ${date}`);
    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
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
       console.log(`[CRON] cancelled job ${date}`)
      job[1].stop()
    }
  })
}

function onComplete(date) {
  console.log(`[CRON] job completed ${date}\n`)
  
  jobs.forEach((job, i) => {
    if(job[0] === date) {
      console.log(`[CLEANUP] remove job ${date} at index ${i}`)
      jobs.splice(i, 1)
    }
  })
  console.log(`[CLEANUP] ${jobs.length} job(s) pending`)
}