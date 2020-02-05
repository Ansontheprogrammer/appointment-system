import 'mocha';
import * as assert from 'assert';
import { app } from '../server'
import supertest from 'supertest';

const request = supertest(app)

describe('POST /api/cancelAppointment', () => {
    it('should cancel an appointment', done => {
        const form = {
            customer: {
                date: '2019-20-2 10:01',
                phoneNumber: '9082097544'
            }, 
            barberName: 'Jimmy', 
            id: '90832fefe'
        }

        request
        .post('/api/cancelAppointment')
        .send(form)
        .expect(200)
        .end(function(err, res) {
            if (err) done(err);
            else done()
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

