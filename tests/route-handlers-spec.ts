import 'mocha';
import * as assert from 'assert';
import { app } from '../server'
import supertest from 'supertest';

const request = supertest(app)

const barber = 'Kelly'
const fromDate =  '2019-01-4 14:50'  
const barberShop = 'barberSharp'


describe('POST /v1/create/appointment/:barbershop/:barber/:appointmentID', () => {
    it('should create an appointment', done => {
        const services = [
          {   price: 20,
              duration: 30,
              service: 'Child’s Haircut (12 and under)' 
          } 
        ]

        const body = { 
          date: '2019-09-13 14:00', 
          name: 'Anson', 
          services,
          phoneNumber: '9082097544'
        }

        request
        .post(`/v1/create/appointment/${barberShop}/${barber}/`)
        .send(body)
        .expect(200)
        .end(function(err, res) {
            if (err) done(err)
            else {
                done()
            }
        });
    })
})

describe('POST /v1/delete/appointment/:barbershop/:barber/:appointmentID', () => {

    it('should cancel an appointment', done => {
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }
        const id = '831f0840-5538-11ea-b197-0db2f504ed2b'
        const body = {
            appointmentID: id,
            clientName: customer.firstName,
            phoneNumber: customer.phoneNumber,
            date: fromDate
        }

        request
        .post(`/v1/delete/appointment/${barberShop}/${barber}/`)
        .send(body)
        .expect(200)
        .end(function(err, res) {
            if (err) done(err)
            else {
                done()
            }
        });
    })
})

describe('GET /v1/get/schedule/:barbershop/:barber', () => {
    it('should retrieve barber schedule', done => {
        const expectedSchedule = { 
            availableTimes:
                [  'Wed, January 2nd, 9:00 am',
                'Wed, January 2nd, 9:30 am',
                'Wed, January 2nd, 10:00 am',
                'Wed, January 2nd, 10:30 am',
                'Wed, January 2nd, 11:00 am',
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
        .get(`/v1/get/schedule/barberSharp/${barber}?totalDuration=60&fromDate=${fromDate}`)
        .expect(200)
        .end(function(err, res) {
            if (err) return done(err);
            assert.deepEqual(res.body, expectedSchedule)
            done()
        });
    })
})
describe('POST /v1/phone/:barbershop', () => {
  it('should start phone flow', done => {
  //   sinon.stub(twilioLib.client.messages, 'create').callsFake((createdMessage) => {
  //     // functions were called in correct order
  //     const expectedMessage = { 
  //         from: '16125023342',
  //         body: 'Here\'s a link to book at a later date fadesofgray.netlify.com/cue',
  //         to: '9082097544' 
  //     }

  //     assert.deepEqual(createdMessage, expectedMessage)
  //     return 
  // })
      request
      .post(`/v1/phone/${barberShop}`)
      .expect(200)
      .end(function(err, res) {
          if (err) return done(err);
          done()
      });
  })
})

describe('POST /v1/send/:barbershop/:notification', () => {
  it('should send text blast', done => {
      const body = {
        message: 'Success!'
      }
      request
      .post(`/v1/send/${barberShop}/${barber}/textBlast`)
      .send(body)
      .expect(200)
      .end(function(err, res) {
          if (err) return done(err);
          done()
      });
  })

  it('should send customer no call no show service fee', done => {
    const body = { 
      amountOfTimesTheyHaveCanceled: 1, 
      customerPhoneNumber: '9082097544' 
    }
    request
    .post(`/v1/send/${barberShop}/${barber}/noCallNoShow`)
    .send(body)
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        done()
    });
  })
})

describe('POST /v1/update/companyInfo/:barbershop/', () => {
    it('should update company information', done => {
        const body = {
            id: 1,
            barberShopName: 'barberSharp',
            friendlyName: 'Barber Sharp',
            url: 'https://0643ad15.ngrok.io',
            phoneVoice: 'Polly.Justin',
            twilioNumber: '+16124393345',
            shopPhoneNumber: '949029323',
            timeZone: 'America/Chicago',
            shopAvailability: {
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
            },
            serviceList: {
                1: {
                  service: 'Classic Cut and Hot Lather Shave Combo',
                  price: 45,
                  duration: 45
                },
                2: {
                  service: 'Classic Cut with Famous Razor Finish',
                  price: 22,
                  duration: 30,
                },
                3: {
                  service: 'Skin Fade',
                  price: 27,
                  duration: 30,
                },
                4: {
                  service: 'Shampoo (relax and cleanse) ',
                  price: 5,
                  duration: 15,
                },
                5: {
                  service: 'Child’s Haircut',
                  price: 20,
                  duration: 30
                },
                6: {
                  service: 'Senior’s Haircut',
                  price: 15,
                  duration: 30
                },
                7: {
                  service: 'Gray Blending',
                  price: 25,
                  duration: 45
                },
                8: {
                  service: 'Vigorous Scalp Massage',
                  price: 7,
                  duration: 30
                },
                9: {
                  service: 'Vigorous Scalp Massage with Haircut',
                  price: 5,
                  duration: 30
                },
                10: {
                  service: 'Ultimate Sharp Shave',
                  price: 55,
                  duration: 90
                },
                11: {
                  service: 'Classic Hot Lather Shave',
                  price: 35,
                  duration: 45
                },
                12: {
                  service: 'Head Shave',
                  price: 27,
                  duration: 45
                },
                13: {
                  service: 'Neck Shave',
                  price: 5,
                  duration: 30
                },
                14: {
                  service: 'Beard Trim',
                  price: 15,
                  duration: 30
                },
                15: {
                  service: 'Beard Trim & Haircut',
                  price: 29,
                  duration: 45
                },
            }
        }

        request
        .post('/v1/update/companyInfo/barberSharp')
        .send(body)
        .expect(200)
        .end(function(err, res) {
            if (err) return done(err);
            done()
        });
    })
})
