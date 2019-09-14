import * as types from './'
import * as twilioLib from './twilio'

// store a variable containing if the shop is closed or not.
const shopIsClosed = (() => {
    const currentTime = new Date().getHours()
    return (
      currentTime < parseInt(twilioLib.barberShopAvailablilty.open) ||
      currentTime > parseInt(twilioLib.barberShopAvailablilty.closed)
    )
  })()
  
  export function phoneNumberFormatter(phoneNumber: string) {
    if (phoneNumber[0] === '+') return phoneNumber.slice(2)
    if (phoneNumber[0] === '1') return phoneNumber.slice(1)
    return phoneNumber
  }
  
  export function extractText(body: string): string {
    return String(body.match(/\w+/gi))
  }
  
  export function getAvailableTimes(
    duration: number,
    interval: number,
    allocatedTimes: ALLOCATED_TIMES[],
    from: string,
    to: string,
    barber: BARBER
  ): TimeAvailability[] {
    // set time to get available times
    let fromTime = barberShopAvailablilty.open
    let toTime = barberShopAvailablilty.closed
  
    return scheduler.getIntersection({
      from,
      to,
      duration,
      interval,
      schedules: [
        {
          weekdays: {
            from: fromTime,
            to: toTime
          },
          saturday: {
            from: fromTime,
            to: toTime
          },
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
    services: SERVICES[],
    barber: BARBER,
    date?: string
  ): string[] {
    const currentDateAndTime = moment()
    const currentTime = parseInt(currentDateAndTime.format('H'))
    let from = currentDateAndTime.format('YYYY-MM-DD')
    const currentDayOfTheWeek = new Date().getDay()
    // check if barbershop is closed and move the user to make an appointment for the next day
    if (
      currentTime > parseInt(barberShopAvailablilty.closed) ||
      currentTime < parseInt(barberShopAvailablilty.open)
    ) {
      if (currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Monday.index)
        from = moment(from)
          .add(barberShopAvailablilty.daysClosed.Monday.nextAvailableDay, 'day')
          .format('YYYY-MM-DD')
      else if (
        currentDayOfTheWeek === barberShopAvailablilty.daysClosed.Sunday.index
      )
        from = moment(from)
          .add(barberShopAvailablilty.daysClosed.Sunday.nextAvailableDay, 'day')
          .format('YYYY-MM-DD')
      else
        from = moment(from)
          .add(1, 'day')
          .format('YYYY-MM-DD')
    }
  
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
  
  export function validateMessage(body: string, validResponses: string[]) {
    let extractedNumber
    extractedNumber = body.match(/\d/gi)
  
    if (!extractedNumber) return false
    extractedNumber = extractedNumber[0]
    return validResponses.includes(extractedNumber)
  }
  
  export function extractedNumbers(body: string) {
    const extractedNumbers = body.match(/\d/gi)
    if (extractedNumbers.length === 1) {
      if (extractedNumbers[0].length > 1) return extractedNumbers[0].split('')
      else return extractedNumbers
    }
    return extractedNumbers
  }