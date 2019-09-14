import moment from 'moment'

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

export const testCronDate = () => {
  const dateWithTimeZone = new Date().toLocaleString('en-US', {
    timeZone: 'America/Mexico_City'
  })
  const currDate = new Date(dateWithTimeZone)
  const currentHour = moment().format('H')
  const dayOfMonth = currDate.getDate()
  const minutes = currDate.getMinutes()
  const month = currDate.getMonth()

  return `0 ${minutes + 2} ${currentHour} ${dayOfMonth} ${month} *`
}
