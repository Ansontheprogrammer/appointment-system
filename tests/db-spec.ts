import 'mocha';
import * as assert from 'assert';
import sinon from 'sinon';
import { Database } from '../lib/database'

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
            const name = Database.firstLetterUpperCase('anson')
            assert.equal(name, 'Anson');
        })
    })

    describe('addAppointment', () => {
        const db = new Database({
            firstCollection: 'barbershops',
            doc: 'barberSharp',
            secondCollection: 'barbers'
        })
        const barberName = 'Kelly';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }

        it('should create an appointment', async() => {
        // TODO: Find a way to override firebase
            const details = {
                services: [
                    {   price: 20,
                        duration: 30,
                        service: 'Child’s Haircut (12 and under)' 
                    } 
                ],
                time: { 
                    duration: 30,
                    from: '2019-09-15 14:00'
                },
                total: 25
            }
            try {
                const appointmentID = await db.addAppointment(barberName, customer, details)
                assert.equal(appointmentID.toString().length >= 1, true)
            } catch(err){
                throw Error(err)
            }
        })

        it('should not create an appointment, because appointment already scheduled', async () => {
            // TODO: Find a way to override firebase
                const details = {
                    services: [
                        {   price: 20,
                            duration: 30,
                            service: 'Child’s Haircut (12 and under)' 
                        } 
                    ],
                    time: { 
                        duration: 30,
                        from: '2019-11-13 13:00'
                    },
                    total: 25
                }
                try {
                    const appointmentID = await db.addAppointment(barberName, customer, details)
                    assert.equal(appointmentID.toString().length >= 1, true)
                } catch(err){
                    throw Error(err)
                }
            })
    })
})