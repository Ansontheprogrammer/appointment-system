import 'mocha';
import * as assert from 'assert';
import sinon from 'sinon';
import { validateAppointmentDetails } from '../config/utils'
import * as databaseLib from '../lib/database'

describe('Database class', () => {
    let sandbox;
    const database = new databaseLib.Database()
    // Set barber data
    databaseLib.Database.setBarberShopData({}, {sendStatus: (e) => {}}, {})


    beforeEach(() => {
        // stub out all database functions
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        // restore all mongo db functions
        sandbox.restore();
    })

    describe('firstLetterUpperCase', () => {
        it('it should change letter to upperCase', () => {
            const name = databaseLib.Database.firstLetterUpperCase('anson')
            assert.equal(name, 'Anson');
        })
    })

    describe('addAppointment', () => {
        const barberName = 'Julian';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }
        const uuid = '7bf1d650-d721-11e9-8247-277ad5bcc2333'
        const details = {
            services: [],
            time: { 
                duration: 30,
                from: '2019-09-14 12:00'
            },
            total: 25
        }
        const invalidDetails = {
            services: [],
            time: { 
                duration: 30,
                from: 'Invalid date'
            },
            total: 25
        }

        it('should not validate an appointment because of invalid date', done => {
            const areAppointmentDetailsValid = validateAppointmentDetails(invalidDetails).correct
            assert.equal(areAppointmentDetailsValid, false)
            done()
        })

        it('should validate an appointment', done => {
            const areAppointmentDetailsValid = validateAppointmentDetails(details).correct
            assert.equal(areAppointmentDetailsValid, true)
            done()
        })
        
        it('should create an appointment', done => {
            const details = {
                services: [],
                time: { 
                    duration: 30,
                    from: '2019-09-14 13:30'
                },
                total: 25
            }
            database.addAppointment(barberName, customer, details).then(() => {
                done()
            }, done)
        })
    })
})