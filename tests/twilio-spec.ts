// import 'mocha';
// import * as assert from 'assert';
// import * as twilio from '../lib/twilio';
// import * as config from '../config/config'
// import { Database } from '../lib/database';
// import sinon from 'sinon';
// import { resolve } from 'dns';

// const textSystem = new twilio.TextSystem()

// describe('Twilio functions', () => {
//     const database = new Database();
    
//     let sandbox;

//     beforeEach(() => {
//         // stub out all database functions
//         sandbox = sinon.createSandbox()
//     })

//     afterEach(() => {
//         // restore all mongo db functions
//         sandbox.restore();
//     })

//     describe('phoneNumberFormatter', () => {
//         it('it should change beginning +1 phone number format', () => {
//             const phoneNumber = '+19082097544';
//             const expectedPhoneNUmber = '9082097544';

//             const formattedPhoneNumber = textSystem.phoneNumberFormatter(phoneNumber);
//             assert.equal(formattedPhoneNumber, expectedPhoneNUmber);
//         })

//         it('it should change beginning 1 phone number format', () => {
//             const phoneNumber = '19082097544';
//             const expectedPhoneNUmber = '9082097544';

//             const formattedPhoneNumber = textSystem.phoneNumberFormatter(phoneNumber);
//             assert.equal(formattedPhoneNumber, expectedPhoneNUmber);
//         })
//     })

//     // describe('testMessageFlow', () => {
//     //     it('it should begin text message flow', done => {
//     //         const req = {
//     //             body: { 
//     //                 From: '+19082097544'
//     //             }
//     //         }

//     //         const res = {
//     //             writeHead: (statusCode: number, type: {'Content-Type': 'text/xml'}) => {},
//     //             end: (msg: string) => {}
//     //         }

//     //         const next = () => {}

//     //         const expectedCustomer = new Promise((resolve, reject) => {
//     //             resolve({
//     //                 phoneNumber: req.body.From,
//     //                 firstName: 'Anson',
//     //                 stepNumber: '1'
//     //             })
//     //         })

//     //         sandbox.stub(database, 'findCustomerInDatabase')
//     //         .withArgs({ phoneNumber: req.body.From })
//     //         .yields(null, expectedCustomer) 

//     //         twilio.textMessageFlow(req, res, next).then(() => {
//     //             done()
//     //         })
//     //     })
//     // })
// })