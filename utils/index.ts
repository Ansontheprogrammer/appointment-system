import moment from 'moment'

// Expects time to be in format yyyy-mm-dd hh-mm
export const formatToCronTime = time => {
  // Date & Timezone
  const dateWithTimeZone = new Date().toLocaleString('en-US', {
    timeZone: 'America/Mexico_City'
  })
  const currDate = new Date(dateWithTimeZone)

  // Date Values for cron job
  const minutes = moment(time).format('m')
  const hour = moment(time).format('H')
  const alertHour = parseInt(hour) - 1
  const date = currDate.getDate()

  return `0 ${minutes} ${alertHour} ${date} ${currDate.getMonth()} *`
}
