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
            console.log(timeZone, 'timeZone')
            assert.equal(timeZone, 'America/Chicago')
        })
        
    })

    describe('addAppointment', () => {
        const barberName = 'Julian';
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
})
})