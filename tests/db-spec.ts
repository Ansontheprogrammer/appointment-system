import 'mocha';
import * as assert from 'assert';
import sinon from 'sinon';
import * as databaseLib from '../lib/database'
import { BARBER_APPOINTMENTS } from '../lib';
import uuid from 'uuid';

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

    describe('findBarberInDatabase', () => {
        it('should attempt to find barber in database', () => {
            sandbox.stub(databaseLib.barberCollection, 'doc').callsFake((barberName: string) => { 
                assert.equal(barberName, 'Julian');
                return {
                    get: () => {
                        return new Promise((resolve, reject) => {
                            resolve({ data: () => { return { phoneNumber: '908029854' } }})
                        })
                    },
                }
            })
            new databaseLib.Database().findBarberInDatabase('Julian').then(barber => {
                const expectedBarberData = { phoneNumber: '908029854' };
                assert.deepEqual(barber, expectedBarberData)
            })
        })
    })

    describe('updateBarber', () => {
        it(`should attempt to update a barber's fields in the database`, () => {
            sandbox.stub(databaseLib.barberCollection, 'doc').callsFake((barberName: string) => { 
                assert.equal(barberName, 'Julian');
                return {
                    update: (updatedAppointments: BARBER_APPOINTMENTS[]) => {
                        assert.deepEqual(updatedAppointments, {})
                        return {
                            then: () => {}
                        }
                    },
                }
            })
            new databaseLib.Database().updateBarber('Julian', {}).then(barber => {
                const expectedBarberData = {};
                assert.deepEqual(barber, expectedBarberData)
            })
        })
    })

    describe('createCustomer', () => {
        it('should attempt to find customer in database', () => {
            sandbox.stub(databaseLib.customerCollection, 'doc').callsFake((phoneNumber: string) => { 
                assert.equal(phoneNumber, '9082097544');
                return {
                    get: () => {
                        return new Promise((resolve, reject) => {
                            resolve({ data: () => { return { phoneNumber: '908029854' } }})
                        })
                    },
                }
            })
            new databaseLib.Database().findCustomerInDatabase('9082097544').then(barber => {
                const expectedCustomerData = { phoneNumber: '908029854' };
                assert.deepEqual(barber, expectedCustomerData)
            })
        })
    })


    describe('addAppointment', () => {
        const barberName = 'Kelly';
        const customer = {
            phoneNumber: '9082097544',
            firstName: 'Anson'
        }

        it('should create an appointment with no appointments currently stored', done => {
            const expectedAppointment = `{
    "appointments": [
        {
            "phoneNumber": "9082097544",
            "firstName": "Anson",
            "details": {
                "services": [
                    "Hair cut"
                ],
                "time": {
                    "duration": 30,
                    "from": "2019-09-14 13:30"
                },
                "total": 25
            },
            "uuid": "24a888e0-2824-11ea-9786-1568773a6827"
        }
    ]
}`
            
            sandbox.stub(databaseLib.barberCollection, 'doc').callsFake((barberName: string) => { 
                assert.equal(barberName, 'Julian');
                return {
                    get: () => {
                        return {
                            get: (field: string) => {
                                assert.equal(field, 'appointments');
                                return []
                            }
                        }
                    },
                    update: (updatedAppointments: BARBER_APPOINTMENTS[]) => {
                        assert.equal(JSON.stringify(updatedAppointments, null, 4), expectedAppointment)
                    },
                }
            })
            sandbox.stub(uuid, 'v1').callsFake(() => { 
                return '24a888e0-2824-11ea-9786-1568773a6827'
            })

            // TODO: Find a way to override firebase
            const details = {
                services: ['Hair cut'],
                time: { 
                    duration: 30,
                    from: '2019-09-14 13:30'
                },
                total: 25
            }
            new databaseLib.Database().addAppointment(barberName, customer, details).then(() => {
                done()
            }, done)
        })

        it('should create an appointment with appointments stored', done => {
            const expectedAppointments = `{
    "appointments": [
        {
            "phoneNumber": "9082097544",
            "firstName": "Anson",
            "details": {
                "services": [
                    "Hair cut"
                ],
                "time": {
                    "duration": 30,
                    "from": "2019-09-13 13:30"
                },
                "total": 25
            },
            "uuid": "24a888e0-2824-11ea-9786-1568773a6827"
        },
        {
            "phoneNumber": "9082097544",
            "firstName": "Anson",
            "details": {
                "services": [
                    "Hair cut"
                ],
                "time": {
                    "duration": 30,
                    "from": "2019-09-14 13:30"
                },
                "total": 25
            },
            "uuid": "24a888e0-2824-11ea-9786-1568773a6827"
        }
    ]
}`
            
            sandbox.stub(databaseLib.barberCollection, 'doc').callsFake((barberName: string) => { 
                assert.equal(barberName, 'Julian');
                return {
                    get: () => {
                        return {
                            get: (field: string) => {
                                assert.equal(field, 'appointments');
                                return [{
                                    "phoneNumber": "9082097544",
                                    "firstName": "Anson",
                                    "details": {
                                        "services": [
                                            "Hair cut"
                                        ],
                                        "time": {
                                            "duration": 30,
                                            "from": "2019-09-13 13:30"
                                        },
                                        "total": 25
                                    },
                                    "uuid": "24a888e0-2824-11ea-9786-1568773a6827"
                                    }
                                ]
                            }
                        }
                    },
                    update: (updatedAppointments: BARBER_APPOINTMENTS[]) => {
                        // assert.equal(JSON.stringify(updatedAppointments, null, 4), expectedAppointment)
                        assert.equal(JSON.stringify(updatedAppointments, null, 4), expectedAppointments)
                    },
                }
            })
            sandbox.stub(uuid, 'v1').callsFake(() => { 
                return '24a888e0-2824-11ea-9786-1568773a6827'
            })

            // TODO: Find a way to override firebase
            const details = {
                services: ['Hair cut'],
                time: { 
                    duration: 30,
                    from: '2019-09-14 13:30'
                },
                total: 25
            }
            new databaseLib.Database().addAppointment(barberName, customer, details).then(() => {
                done()
            }, done)
        })

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
                const appointmentID = await new databaseLib.Database().addAppointment(barberName, customer, details)
                assert.equal(appointmentID.toString().length >= 1, true)
            } catch(err){
                throw Error(err)
            }
        })

        it('should not create an appointment, because appointment already scheduled', done => {
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
                new databaseLib.Database().addAppointment(barberName, customer, details).then(() => {
                    done('Was suppose to trigger an error.')
                }, err => {
                    assert.equal(err.message, 'Appointment already scheduled')
                    done()
                })
            })
    })
})