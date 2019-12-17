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

        // it('should create an appointment', done => {
        // TODO: Find a way to override firebase
        //     const details = {
        //         services: ['Hair cut'],
        //         time: { 
        //             duration: 30,
        //             from: '2019-09-14 13:30'
        //         },
        //         total: 25
        //     }
        //     database.addAppointment(barberName, customer, details).then(() => {
        //         done()
        //     }, done)
        // })
    })
})