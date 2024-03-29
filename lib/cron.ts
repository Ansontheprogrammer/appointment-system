const CronJob = require('cron').CronJob
import { client, sendText } from './twilio'
export const appointmentsInQueue = []
import * as types from './'
import { formatToCronTime } from '../config/utils';
import { DocumentData } from '@google-cloud/firestore';
import { AE_Allision } from 'ae-backend-database';
import { db } from './database';
import schedule from 'node-schedule'
import { request } from 'http';

export function createJob(date: string, phoneNumber: string, message: string, id: string, timezone: string) {
  let job = new CronJob(date, function () {
    sendText(message, phoneNumber)

    this.stop()
  }, () => onComplete(id), true, timezone)
  
  appointmentsInQueue.push([id, job])
}

export function sendBackUpEmail(backup){
  (request as any)('https://application-form-server.glitch.me/', { 
      body : JSON.stringify({
        ...backup,
        sendTo: 'anson.ervin@gmail.com'
      })
    }, (err, res, body) => {
      if (err) { return console.log(err); }
      console.log(body)
    })
}
export async function scheduleBackup(companyType: string, companyName: string) {
  var rule = new schedule.RecurrenceRule();
  rule.hour = 1
  
  schedule.scheduleJob(rule, async function(){
    // Create backup
    const backup: any = await AE_Allision.createBackup(db, {
      companyType: companyType,
      companyName: companyName,
      admin: 'barbers',
      client: 'customers'
    })
    // store backup
    db
    .collection(companyType)
    .doc(companyName)
    .collection('backups')
    .doc(backup.time)
    .set({ ...backup } as any);

    // Send email
    // sendBackUpEmail(backup)
  })
}

export function cancelJob(id: string) {  
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

export function resetCronJobs(barberCollection: FirebaseFirestore.CollectionReference<DocumentData>) {
  barberCollection
    .get()
    .then(snapshot => {
      snapshot.docs.forEach(doc => {
        const barberName = doc.id
        const barberAppointments = (doc.get('appointments') as types.BARBER_APPOINTMENTS[]);
        barberAppointments.forEach(appointment => {
          const reminderMessage = this.UserMessage.getReminderMessage(
            appointment.details.services,
            (barberName as any),
            appointment.details.time.from,
            appointment.details.total
          )
          createJob(
            formatToCronTime(appointment.details.time.from),
            appointment.phoneNumber,
            reminderMessage,
            appointment.uuid,
            'America/Chicago'
          )
        })
      })
    })
}