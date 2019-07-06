const CronJob = require('cron').CronJob

export function createJob(date, phoneNumber, client, config) {
  new CronJob(date, function () {
    console.log('CRON JOB RAN')
    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      body:
        `test alert message`,
      to: phoneNumber
    })

    this.stop()
  }, onComplete, true, 'America/Mexico_City')
}

function onComplete() {
  console.log('completed')
}