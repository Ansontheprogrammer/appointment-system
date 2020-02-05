import 'mocha';
import * as assert from 'assert';
import { app } from '../server'
import supertest from 'supertest';
import { clearQueue, createJob, appointmentsInQueue } from '../lib/cron';
import { formatToCronTime } from '../config/utils';
import moment from 'moment-timezone'
import { database } from '../lib/twilio';

const request = supertest(app)

describe('POST /api/cancelAppointment', () => {
    afterEach(() => {
        clearQueue()
    })

    it('should cancel an appointment', async() => {
        const barberName = 'Kelly';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }
        const details = {
            services: [
                {   price: 20,
                    duration: 30,
                    service: 'Child’s Haircut (12 and under)' 
                } 
            ],
            time: { 
                duration: 30,
                from: moment().tz("America/Chicago").format('YYYY-MM-DD HH:mm')
            },
            total: 25
        }

        const id = await database.addAppointment(barberName, customer, details)
        const phoneNumber = '9082097544'

        const form = {
            customer: {
                phoneNumber,
                name: 'Anson',
            }, 
            barberName: 'Kelly', 
            id
        }
        // create job
        const date = moment().tz("America/Chicago").format('YYYY-MM-DD HH:mm')
        
        createJob(formatToCronTime(date), phoneNumber, 'Creating dummy reminder', (id as string))
        
        request
        .post('/api/cancelAppointment')
        .send(form)
        .expect(200)
        .end(function(err, res) {
            if (err) return err;
            else {
                assert.equal(appointmentsInQueue, [])
                return
            }
        });
    })
})

describe('POST /api/getBarberAvailableTimes', () => {
    it('should retrieve barber schedule', done => {
        const form = {
            barber: 'Kelly',
            fromDate: '2019-01-02',
            toDays: 15,
            services: [{
                duration: 50,
                price: 10
            }]
        }

        const expectedSchedule = { 
            availableTimes:
                [ 'Wed, January 2nd, 9:00 am',
                'Wed, January 2nd, 9:30 am',
                'Wed, January 2nd, 10:00 am',
                'Wed, January 2nd, 10:30 am',
                'Wed, January 2nd, 11:00 am',
                'Wed, January 2nd, 1:00 pm',
                'Wed, January 2nd, 1:30 pm',
                'Wed, January 2nd, 2:00 pm',
                'Wed, January 2nd, 2:30 pm',
                'Wed, January 2nd, 3:00 pm',
                'Wed, January 2nd, 3:30 pm',
                'Wed, January 2nd, 4:00 pm',
                'Wed, January 2nd, 4:30 pm',
                'Wed, January 2nd, 5:00 pm',
                'Wed, January 2nd, 5:30 pm',
                'Wed, January 2nd, 6:00 pm' ] 
        }

        request
        .post('/api/getBarberAvailableTimes')
        .send(form)
        .expect(200)
        .end(function(err, res) {
            if (err) return done(err);
            assert.deepEqual(res.body, expectedSchedule)
            done()
        });
    })
})

