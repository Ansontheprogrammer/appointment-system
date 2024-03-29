// import 'mocha';
// import * as assert from 'assert';
// import * as twilioLib from '../lib/twilio';
// import { PhoneSystem } from '../lib/flow/phoneFlow'
// // import { Database, serviceList } from '../lib/database';
// import sinon from 'sinon';
// // import { shopIsClosed } from '../config/utils';
// import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

// describe('Phone Flow System', () => {
//     let sandbox: sinon.SinonSandbox;

//     beforeEach(() => {
//         sandbox = sinon.createSandbox()
//     })

//     afterEach(() => {
//         sandbox.restore();
//     })

//     const phoneNumber = '9082097544'

//     const req = {
//         body: {

//         }
//     }

//     const res = {
//         writeHead: (statusCode, httpHeader) => {
//             // return the passed in values to ensure it contains the correct status code and http header
//             assert.equal(statusCode, 200)
//             assert.deepEqual(httpHeader, { 'Content-Type': 'text/xml' })
//         },
//         end: (twilioLibMessageString) => {
//             // test that it's returning twiml
//             const twilioTwiml = `<Response><Message>`
//             assert.equal(twilioLibMessageString.includes(twilioTwiml), true)
//         },
//         send: (message) => {},
//         req: {
//             body: {
//                 From: phoneNumber
//             }
//         }
        
//     }

    
//     describe('phoneAppointmentFlow', () => {
//         it('it should return twiml to start phone flow also allowing multiple service choice.', done => {
//             const expectedMultipleServiceChoiceTwiml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say voice=\"Polly.Salli\">The shop is closed currently. I'm sending you a link to book an appointment at a later date</Say></Response>"
            
//             res.send = (message) => {
//                 assert.deepEqual(JSON.stringify(message, null, 4), JSON.stringify(expectedMultipleServiceChoiceTwiml, null, 4))
//                 done()
//             }
    
//             new PhoneSystem().phoneAppointmentFlow({}, res, {})
//         })

//         //** TODO - make test for choosing non multiple choices */

//         it('it should ensure that create customer is called after find customer in database', done => {
//             let calledFindCustomerInDatabase;
//             // sinon.stub(twilioLib.database, 'findCustomerInDatabase').callsFake(phoneNumber => {
//             //     console.log(phoneNumber, 'phoneNumber')
//             //     calledFindCustomerInDatabase = true
//             //     return new Promise((resolve, reject) => resolve('success' as any))
//             // })
//             // sinon.stub(twilioLib.database, 'createCustomer').callsFake(phoneNumber => {
//             //     // functions were called in correct order
//             //     if(calledFindCustomerInDatabase) done()
//             //     else done('create customer was called before we attempted to find them in database')
//             //     return new Promise(() => {})
//             // })
//             res.send = (message) => {
//             }
    
//             new PhoneSystem().phoneAppointmentFlow({}, res, {}).then(done, done)
//         })

//         // it('it should send the user a text message if the shop is closed currently', done => {
//         //     sinon.stub(new VoiceResponse, 'say').callsFake((message, voice) => {
//         //         // functions were called in correct order
//         //         return new VoiceResponse.Say()
//         //     })
//         //     sinon.stub(twilioLib.client.messages, 'create').callsFake((createdMessage) => {
//         //         // functions were called in correct order
//         //         const expectedMessage = { 
//         //             from: '16125023342',
//         //             body: 'Here\'s a link to book at a later date fadesofgray.netlify.com/cue',
//         //             to: '9082097544' 
//         //         }
         
//         //         assert.deepEqual(createdMessage, expectedMessage)
//         //         return 
//         //     })
//         //     res.send = (message) => {
            
//         //     }
    
//         //     new PhoneSystem().phoneAppointmentFlow({}, res, {}).then(done, done)
//         // })
//     })
// })