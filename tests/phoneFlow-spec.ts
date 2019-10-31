import 'mocha';
import * as assert from 'assert';
import * as twilioLib from '../lib/twilio';
import { PhoneSystem } from '../lib/flow/phoneFlow'
import { Database, serviceList } from '../lib/database';
import sinon from 'sinon';
import { shopIsClosed } from '../config/utils';

describe('Phone Flow System', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore();
    })

    const phoneNumber = '9082097544'

    const req = {
        body: {

        }
    }

    const res = {
        writeHead: (statusCode, httpHeader) => {
            // return the passed in values to ensure it contains the correct status code and http header
            assert.equal(statusCode, 200)
            assert.deepEqual(httpHeader, { 'Content-Type': 'text/xml' })
        },
        end: (twilioLibMessageString) => {
            // test that it's returning twiml
            const twilioTwiml = `<Response><Message>`
            assert.equal(twilioLibMessageString.includes(twilioTwiml), true)
        },
        send: (message) => {},
        req: {
            body: {
                From: phoneNumber
            }
        }
        
    }

    

    it.only('phoneAppointmentFlow', done => {
        res.send = (message) => {
            console.log(message, 'message in send')
        }

        new PhoneSystem().phoneAppointmentFlow({}, res, {})
    })

    describe('textMessageFlow', () => {
        const req = {
            body: {
                From: '19082097544',
                Body: 'Anson'
            }
        }
        describe('shopIsClosed', () => {
            it.only('should return shop is closed because we are passing that in the function', () => {
                const status = shopIsClosed(true)
                assert.equal(status, true)
            })
            it.only('should return shop is closed, because we are trying to book at a time when the shop is not open yet', () => {
                // stub out getHours Date object and force it to return a number less than when the shop is open
                const now = new Date('August 17, 2019 03:24:00');
                const clock = sinon.useFakeTimers(now.getTime())
                const status = shopIsClosed()
                assert.equal(status, true)
                clock.restore()
            })
            it.only('should return shop is closed, because we are trying to book at a time when the shop has closed already', () => {
                // stub out getHours Date object and force it to return a number less than when the shop is open
                const now = new Date('August 17, 2019 21:24:00');
                const clock = sinon.useFakeTimers(now.getTime())
                const status = shopIsClosed()
                assert.equal(status, true)
                clock.restore()
            })
            it.only('should return shop is not closed, because we are trying to book at a time when the shop is open', () => {
                // stub out getHours Date object and force it to return a number less than when the shop is open
                const now = new Date('August 17, 2019 12:24:00');
                const clock = sinon.useFakeTimers(now.getTime())
                console.log(now.getTime(), 'time')
                const status = shopIsClosed()
                assert.equal(status, false)
                clock.restore()
            })
        })
    })
})