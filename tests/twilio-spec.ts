import 'mocha';
import * as assert from 'assert';
import * as twilioLib from '../lib/twilio';
import { TextSystem } from '../lib/flow/smsFlow'
import { Database, serviceList } from '../lib/database';
import sinon from 'sinon';

describe('User message interface', () => {
    const sampleServices = [
        {
            service: 'Adult Haircut',
            price: 25,
            duration: 45
        },
        {
            service: 'Child Haircut',
            price: 15,
            duration: 30,
        },
    ]
    const sampleBarberAvailableTimes = [
        'Sat, August 24th, 4:30pm',
        'Sat, August 24th, 4:45pm',
        'Sat, August 24th, 5:00pm',
        'Sat, August 24th, 5:15pm',
        'Sat, August 24th, 5:30pm',
    ]
    const sampleBarber = 'Kelly'
    const sampleTime = '2023-09-09 13:00'
    const sampleTotal = 40

    it('generateRandomAgreeWord', () => {
        const generatedAgreeWord = twilioLib.UserMessage.generateRandomAgreeWord()
        const isAgreeWordValid = twilioLib.UserMessage.agreeWords.find(agreeWord => generatedAgreeWord === agreeWord)
        assert.equal(!!isAgreeWordValid, true)
    })
    it('generateRandomGreeting', () => {
        const generatedGreeting = twilioLib.UserMessage.generateRandomGreeting()
        const isGreetingValid = twilioLib.UserMessage.introGreetingWords.find(greeting => generatedGreeting === greeting)
        assert.equal(!!isGreetingValid, true)
    })
    describe('generateConfirmationMessage', () => {
        it('should create a confirmation message and include appointment confirmation', () => {
            const confirmationMessage = twilioLib.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, false)
            const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
            const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

            assert.equal(!!confirmationMessage, true)
            assert.equal(doesStringIncludeAppointmentConfirmation, true)
        })
        it('should create a confirmation message without appointment confirmation', () => {
            const confirmationMessage = twilioLib.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, true)
            const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
            const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

            assert.equal(!!confirmationMessage, true)
            assert.equal(doesStringIncludeAppointmentConfirmation, false)
        })
        it('without selecting a service we should not be able to send confirmation message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateConfirmationMessage([], sampleBarber, sampleTime, sampleTotal, true) }, Error );
        })
        it('without selecting a barber we should not be able to send confirmation message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateConfirmationMessage(sampleServices, '', sampleTime, sampleTotal, true) }, Error );
        })
        it('without selecting a time we should not be able to send confirmation message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, '', sampleTotal, true) }, Error );
        })
        it('without selecting a total we should not be able to send confirmation message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, 0, true) }, Error );
        })
    })
    describe('generateReminderMessage', () => {
        it('should create a reminder message', () => {
            const reminderMessage = twilioLib.UserMessage.generateReminderMessage(sampleServices, sampleBarber, sampleTime, sampleTotal)
            const expectedReminderMessage = `REMINDER:
Your appointment is less than an hour away.
Service: 
Adult Haircut,
Child Haircut 

Barber: Kelly
Time: Saturday, September 9th, 1:00 pm
Total: $40`
            assert.equal(reminderMessage, expectedReminderMessage)
        })
        it('without selecting a service we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateReminderMessage([], sampleBarber, sampleTime, sampleTotal) }, Error );
        })
        it('without selecting a barber we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateReminderMessage(sampleServices, '', sampleTime, sampleTotal) }, Error );
        })
        it('without selecting a time we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateReminderMessage(sampleServices, sampleBarber, '', sampleTotal) }, Error );
        })
        it('without selecting a total we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilioLib.UserMessage.generateReminderMessage(sampleServices, sampleBarber, sampleTime, 0) }, Error );
        })
    })
    describe('generateAvailableServicesMessage', () => {
        it('should be able to generate available services message', () => {
            const servicesMessage = twilioLib.UserMessage.generateAvailableServicesMessage()
            let message = `What type of service would you like today? \n\nPress multiple numbers for multiple services`
            
            for (let prop in serviceList) {
                message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
            }
            assert.equal(servicesMessage, message)
        })
    })
    describe('generateGetBarberAvailableTimesMessage', () => {
        it('should be able to generate a message containing all of the barbers available times', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateGetBarberAvailableTimesMessage(sampleBarberAvailableTimes)
            let message = `Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
            assert.equal(availableTimesMessage, message)
        })
        it('should not generate correct message', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateGetBarberAvailableTimesMessage(sampleBarberAvailableTimes)
            let message = `Here are their available times\nPress:${[]}`
            assert.equal(availableTimesMessage === message, false)
        })
    })
    describe('generateErrorValidatingAppointmentTime', () => {
        const sampleBarberAvailableTimes = [
            'Sat, August 24th, 4:30pm',
            'Sat, August 24th, 4:45pm',
            'Sat, August 24th, 5:00pm',
            'Sat, August 24th, 5:15pm',
            'Sat, August 24th, 5:30pm',
        ]
        it('should be able to generate a message containing all of the barbers available times', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
            let message = `You must choose a valid response. Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
            assert.equal(availableTimesMessage, message)
        })
        it('should not generate correct message', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
            let message = `Here are their available times\nPress:${[]}`
            assert.equal(availableTimesMessage === message, false)
        })
    })
    describe('generateErrorValidatingAppointmentTime', () => {
        const sampleBarberAvailableTimes = [
            'Sat, August 24th, 4:30pm',
            'Sat, August 24th, 4:45pm',
            'Sat, August 24th, 5:00pm',
            'Sat, August 24th, 5:15pm',
            'Sat, August 24th, 5:30pm',
        ]
        it('should be able to generate a message containing all of the barbers available times', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
            let message = `You must choose a valid response. Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
            assert.equal(availableTimesMessage, message)
        })
        it('should not generate correct message', () => {
            const availableTimesMessage = twilioLib.UserMessage.generateErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
            let message = `Here are their available times\nPress:${[]}`
            assert.equal(availableTimesMessage === message, false)
        })
    })
    it('confirmedAppointmentMessage', () => {
        const confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to remove your appointment \nText: (Remove) \n\nTo book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`;
        assert.equal(twilioLib.UserMessage.confirmedAppointmentMessage, confirmedAppointmentMessage)
    })
    it('chooseAppointmentTypeMessage', () => {
        const chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) for first available time\n(2) to book an appointment for today\n(3) for Later date`;
        assert.equal(twilioLib.UserMessage.chooseAppointmentTypeMessage, chooseAppointmentTypeMessage)
    })
    it('friendlyFormat', () => {
        const friendlyFormat = 'ddd, MMMM Do, h:mm a'
        assert.equal(twilioLib.UserMessage.friendlyFormat, friendlyFormat)
    })
    it('errorConfirmingAppointmentMessage', () => {
        const errorConfirmingAppointmentMessage = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) for first available appointment time\n(2) to book an appointment for today\n(3) for later date`
        assert.equal(twilioLib.UserMessage.errorConfirmingAppointment, errorConfirmingAppointmentMessage)
    })
    it('errorValidatingConfirmingAppointment', () => {
        const errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
        assert.equal(twilioLib.UserMessage.errorValidatingConfirmingAppointment, errorValidatingConfirmingAppointment)
    })
})


describe('Text System', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        // stub out all database functions
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        // restore all mongo db functions
        sandbox.restore();
    })

    const res = {
        writeHead: (statusCode, httpHeader) => {
            // return the passed in values to ensure it contains the correct status code and http header
            assert.equal(statusCode, 200)
            // TODO - figure out why this assert is failing
            // assert.equal(httpHeader, { 'Content-Type': 'text/xml' })
        },
        end: (twilioLibMessageString) => {
            // test that it's returning twiml
            assert.equal(twilioLibMessageString.includes(`<Response><Message>`), true)
        }
    }

    const phoneNumber = '9082097544'

    it('getTextMessageTwiml', () => {
        TextSystem.getTextMessageTwiml(res)
    })
    it('resetUser', () => {
        res.end = (twilioLibMessageString) => {
            const correctTwimlMessage = `Okay let's start from the top! \n${twilioLib.UserMessage.chooseAppointmentTypeMessage}`
            // test that it's returning the correct twiml
            assert.equal(twilioLibMessageString.includes(correctTwimlMessage), true)
        }

        const sendTextMessage = TextSystem.getTextMessageTwiml(res)
        // stub out values reset user passes in
        sandbox.replace(new Database, 'updateCustomer', (phoneNumberFromSandbox, propsToUpdate) => {
            const session = {
                session: {
                    'stepNumber': '2'
                }
            }
            assert.equal(phoneNumberFromSandbox, phoneNumber)
            assert.equal(propsToUpdate, session)
            return new Promise((resolve, reject) => {})
        })

        TextSystem.resetUser(phoneNumber, sendTextMessage)
    })
})