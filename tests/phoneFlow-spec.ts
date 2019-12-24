import 'mocha';
import * as assert from 'assert';
import * as twilioLib from '../lib/twilio';
import { PhoneSystem } from '../lib/flow/phoneFlow'
import sinon from 'sinon';

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

    
    describe('phoneFlow', () => {
        it('it should ensure that create customer is called after find customer in database', done => {
            let calledFindCustomerInDatabase;
            sinon.stub(twilioLib.database, 'findCustomerInDatabase').callsFake(phoneNumber => {
                console.log(phoneNumber, 'phoneNumber')
                calledFindCustomerInDatabase = true
                return new Promise((resolve, reject) => resolve('success' as any))
            })
            sinon.stub(twilioLib.database, 'createCustomer').callsFake(phoneNumber => {
                // functions were called in correct order
                if(calledFindCustomerInDatabase) done()
                else done('create customer was called before we attempted to find them in database')
                return new Promise(() => {})
            })
            res.send = (message) => {
            }
    
            new PhoneSystem().phoneFlow({}, res, {}).then(done, done)
        })

        // it('should send the user a text message if the shop is closed currently', done => {
        //     sinon.stub(new VoiceResponse, 'say').callsFake((message, voice) => {
        //         // functions were called in correct order
        //         return new VoiceResponse.Say()
        //     })
        //     sinon.stub(twilioLib.client.messages, 'create').callsFake((createdMessage) => {
        //         // functions were called in correct order
        //         const expectedMessage = { 
        //             from: '16125023342',
        //             body: 'Here\'s a link to book at a later date fadesofgray.netlify.com/cue',
        //             to: '9082097544' 
        //         }
         
        //         assert.deepEqual(createdMessage, expectedMessage)
        //         return 
        //     })
        //     res.send = (message) => {
            
        //     }
    
        //     new PhoneSystem().phoneFlow({}, res, {}).then(done, done)
        // })
    })
})