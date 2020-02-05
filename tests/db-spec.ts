import 'mocha';
import * as assert from 'assert';
import sinon from 'sinon';
import * as databaseLib from '../lib/database'

describe('Database class', () => {
    let sandbox;

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

    describe('setCorrectTimeZone', () => {
        it('it should set to America/Chicago if no timezone is passed', () => {
            const timeZone = databaseLib.timezone
            assert.equal(timeZone, 'America/Chicago')
        })
        
    })

    describe('addAppointment', () => {
        const barberName = 'Kelly';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }

        it.only('should create an appointment', async() => {
        // TODO: Find a way to override firebase
            const details = {
                services: [
                    {   price: 20,
                        duration: 30,
                        checked: true,
                        service: 'Child’s Haircut (12 and under)' 
                    } 
                ],
                time: { 
                    duration: 30,
                    from: '2019-09-15 13:15'
                },
                total: 25
            }
            try {
                const appointmentID = await new databaseLib.Database().addAppointment(barberName, customer, details)
                console.log(appointmentID, 'appointment id')
            } catch(err){
                console.log( err, 'err appointment id')
            }
        })

        it('should not create an appointment, because appointment already scheduled', done => {
            // TODO: Find a way to override firebase
                const details = {
                    services: [
                        {   price: 20,
                            duration: 30,
                            checked: true,
                            service: 'Child’s Haircut (12 and under)' 
                        } 
                    ],
                    time: { 
                        duration: 30,
                        from: '2019-11-13 13:15'
                    },
                    total: 25
                }
                new databaseLib.Database().addAppointment(barberName, customer, details).then(() => {
                    done('Was suppose to trigger an error.')
                }, err => {
                    assert.equal(err.message, 'Appointment already scheduled')
                    done()
                })
            })
    })
})