const CronJob = require('cron').CronJob
import { client } from './twilio'
import { twilioPhoneNumber, timezone } from './database'
export const appointmentsInQueue = []

export function createJob(date: string, phoneNumber: string, message: string, id: string) {
  // Check to make sure date is not passed ***************
  let job = new CronJob(date, function () {
    client.messages.create({
      from: twilioPhoneNumber,
      body: message,
      to: phoneNumber
    })

    this.stop()
  }, () => onComplete(id), true, timezone)
  
  appointmentsInQueue.push([id, job])
}

export function cancelJob(id: string) {
  console.log('Canceling appointment with id ', id)
  
  appointmentsInQueue.forEach(job => {
    if(job[0] === id) {
      job[1].stop()
    }
  })
}

export function onComplete(id: string) {
  appointmentsInQueue.forEach((job, i) => {
    if(job[0] === id) {
      appointmentsInQueue.splice(i, 1)
    }
  })
}

export function clearQueue() {
  appointmentsInQueue.length = 0;
}