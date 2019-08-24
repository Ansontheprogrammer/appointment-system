import 'mocha';
import * as assert from 'assert';
import * as twilio from '../lib/twilio';
import { serviceList } from '../lib/shopData'
import * as config from '../config/config'
import { Database } from '../lib/database';
import sinon from 'sinon';

const textSystem = new twilio.TextSystem()

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

    const sampleBarber = 'Kelly'
    const sampleTime = '2023-09-09 13:00'
    const sampleTotal = 40

    it('generateRandomAgreeWord', () => {
        const generatedAgreeWord = twilio.UserMessage.generateRandomAgreeWord()
        const isAgreeWordValid = twilio.UserMessage.agreeWords.find(agreeWord => generatedAgreeWord === agreeWord)
        assert.equal(!!isAgreeWordValid, true)
    })
    it('generateRandomGreeting', () => {
        const generatedGreeting = twilio.UserMessage.generateRandomGreeting()
        const isGreetingValid = twilio.UserMessage.introGreetingWords.find(greeting => generatedGreeting === greeting)
        assert.equal(!!isGreetingValid, true)
    })
    describe('generateConfirmationMessage', () => {
        it('should create a confirmation message and include appointment confirmation', () => {
            const confirmationMessage = twilio.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, false)
            const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
            const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

            assert.equal(!!confirmationMessage, true)
            assert.equal(doesStringIncludeAppointmentConfirmation, true)
        })
        it('should create a confirmation message without appointment confirmation', () => {
            const confirmationMessage = twilio.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, true)
            const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
            const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

            assert.equal(!!confirmationMessage, true)
            assert.equal(doesStringIncludeAppointmentConfirmation, false)
        })
        it('without selecting a service we should not be able to send confirmation message', () => {
            assert.throws( function() { twilio.UserMessage.generateConfirmationMessage([], sampleBarber, sampleTime, sampleTotal, true) }, Error );
        })
        it('without selecting a barber we should not be able to send confirmation message', () => {
            assert.throws( function() { twilio.UserMessage.generateConfirmationMessage(sampleServices, '', sampleTime, sampleTotal, true) }, Error );
        })
        it('without selecting a time we should not be able to send confirmation message', () => {
            assert.throws( function() { twilio.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, '', sampleTotal, true) }, Error );
        })
        it('without selecting a total we should not be able to send confirmation message', () => {
            assert.throws( function() { twilio.UserMessage.generateConfirmationMessage(sampleServices, sampleBarber, sampleTime, 0, true) }, Error );
        })
    })
    describe('generateReminderMessage', () => {
        it('should create a reminder message', () => {
            const reminderMessage = twilio.UserMessage.generateReminderMessage(sampleServices, sampleBarber, sampleTime, sampleTotal)
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
            assert.throws( function() { twilio.UserMessage.generateReminderMessage([], sampleBarber, sampleTime, sampleTotal) }, Error );
        })
        it('without selecting a barber we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilio.UserMessage.generateReminderMessage(sampleServices, '', sampleTime, sampleTotal) }, Error );
        })
        it('without selecting a time we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilio.UserMessage.generateReminderMessage(sampleServices, sampleBarber, '', sampleTotal) }, Error );
        })
        it('without selecting a total we should not be able to receive a reminder message', () => {
            assert.throws( function() { twilio.UserMessage.generateReminderMessage(sampleServices, sampleBarber, sampleTime, 0) }, Error );
        })
    })
    describe('generateAvailableServicesMessage', () => {
        it('should be able to generate available services message', () => {
            const servicesMessage = twilio.UserMessage.generateAvailableServicesMessage()
            let message = `What type of service would you like today? \n\nPress multiple numbers for multiple services`
            
            for (let prop in serviceList) {
                message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
            }
            assert.equal(servicesMessage, message)
        })
    })
})
