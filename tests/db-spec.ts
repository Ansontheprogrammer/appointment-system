import 'mocha';
import * as assert from 'assert';
import sinon from 'sinon';
import { Database } from '../lib/database'

describe('Database class', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
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
        const barberName = 'Nick';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }

        it('should create an appointment', async() => {
            const details = {
                services: [
                    {   price: 20,
                        duration: 30,
                        service: 'Child’s Haircut (12 and under)' 
                    } 
                ],
                time: { 
                    duration: 30,
                    from: '2019-09-29 14:00'
                },
                total: 25
            }
            sandbox.stub(db.db, 'createAndUpdateOne').callsFake((properties) => {
                assert.equal(!!properties['appointments'].find(appointment => appointment.details.time.from === details.time.from), true)
                return Promise.resolve('')
            })
            try {
                const appointmentID = await db.addAppointment(barberName, customer, details)
                assert.equal(appointmentID.toString().length >= 1, true)
            } catch(err){
                throw Error(err)
            }
        })

        it('should not create an appointment, because appointment already scheduled', async () => {
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
                    await db.addAppointment(barberName, customer, details)
                    return Promise.reject()
                } catch(err){
                    assert.equal(err.toString(), 'Error: Appointment already scheduled')
                    return Promise.resolve()
                }
            })
    })
})