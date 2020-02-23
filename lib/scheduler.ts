import * as types from './';
import { TimeAvailability, Scheduler } from '@ssense/sscheduler';
import moment from 'moment';
import { friendlyFormat } from '../config/utils';

const scheduler = new Scheduler()

export function getAvailableTimes(
    duration: number,
    interval: number,
    allocatedTimes: types.ALLOCATED_TIMES[],
    from: string,
    to: string,
    barber: types.BARBER,
    barberShopAvailability
): TimeAvailability[] {
    // set time to get available times
    return scheduler.getIntersection({
    from,
    to,
    duration,
    interval,
    schedules: [
        {
        ...barberShopAvailability,
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

export function getSchedule(req, res): any {
    // returns back an array of available times in friendly format - 'ddd, MMMM Do, h:mm a'
    const { fromDate, totalDuration } = req.query
    let from = !!fromDate ? moment(fromDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
    let to = moment(from).add(1, 'day').format('YYYY-MM-DD')
    const interval = 30;
    const barbersAllocatedTimes = req.barber.appointments.map(
        appointment => appointment.details.time
    )
    let availableTimes = getAvailableTimes(
    totalDuration,
    interval,
    barbersAllocatedTimes,
    from,
    to,
    req.barber, 
    req.barberShopInfo.shopAvailability
    )

    if (!availableTimes) {
        return res.json({ availableTimes : [] })
    } else {
        const formattedTimes = formatAllocatedTimes(availableTimes).map(time =>
            moment(`${from} ${time}`, 'YYYY-MM-DD h:mm a').format(friendlyFormat)
        )
      
        return res.json({ availableTimes : formattedTimes })
    }
}

export function formatAllocatedTimes(
    barbersAllocatedTimes: TimeAvailability[]
) {
    return barbersAllocatedTimes
    .filter(availability => availability.available)
    .map(availability => moment(availability.time, 'HH:mm').format('h:mm a'))
}

  // export function queryAllocatedTimes(
  //   barbersAllocatedTimes: TimeAvailability[],
  //   time: string
  // ) {
  //   return barbersAllocatedTimes
  //     .filter(availability => availability.time === time)[0].available
  // }