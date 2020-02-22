import 'mocha';
import * as assert from 'assert';
import * as twilioLib from '../lib/twilio';
import { getAvailableTimes, getSchedule } from '../lib/scheduler';

describe('scheduling appointments', () => {
    const shopAvailability = {
        tuesday : {
            from: '9',
            to: '19',
        },
        wednesday : {
            from: '9',
            to: '19',
        },
        thursday : {
            from: '9',
            to: '19',
        },
        friday : {
            from: '9',
            to: '17',
        },
        saturday : {
            from: '9',
            to: '15',
        }
    }

    const exampleBarber = {
        phoneNumber: '',
        email: '',
        name: '',
        appointments: [
            {
                phoneNumber: '',
                firstName: '',
                uuid: '',
                details: {
                  services: [],
                  time: {
                    from: '2019-15-10 10:00',
                    to: '2019-15-10 11:00'
                  },
                  total: 60
                }
            }
        ],
        unavailabilities: {
            lunch: {
                from: '10:00',
                to: '10:30'
            },
            offDays: [
                {
                    from: '2019-12-10',
                    to: '2019-12-11'
                }
            ],
            vacations: [],
            unavailableTimes: []
        }
    }

    describe('getAvailableTimes', () => {
        it('should not be able to book an appointment during a lunch time', () => {
            const availableTimes = getAvailableTimes(30, 15, [], '2019-12-12', '2019-12-13', (exampleBarber as any), shopAvailability)
            const timesThatShouldBeUnavailable = availableTimes.filter(availableTime => availableTime.time === '10:00' || availableTime.time === '10:15');
            const expectedTimeAvailability = [ 
                { time: '10:00', available: false, reference: null },
                { time: '10:15', available: false, reference: null } 
            ]
            assert.deepEqual(timesThatShouldBeUnavailable, expectedTimeAvailability)
        })
        it('should be able to book an appointment if it is not lunch time or off day', () => {
            const availableTimes = getAvailableTimes(30, 15, [], '2019-12-12', '2019-12-13', (exampleBarber as any), shopAvailability)
            const timesThatShouldBeUnavailable = availableTimes.filter(availableTime => availableTime.time === '10:30' || availableTime.time === '11:00');
            const expectedTimeAvailability = [ 
                { time: '10:30', available: true, reference: null },
                { time: '11:00', available: true, reference: null } 
            ]
            assert.deepEqual(timesThatShouldBeUnavailable, expectedTimeAvailability)
        })
    
        it('should not be able to book an appointment during an off day', () => {
            const availableTimes = getAvailableTimes(30, 15, [], '2019-12-10', '2019-12-11', (exampleBarber as any), shopAvailability)
            const areAllTimesUnavailable = availableTimes.every(availableTime => availableTime.available === false)
            assert.equal(areAllTimesUnavailable, true)
        })
    })
})