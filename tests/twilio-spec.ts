// import 'mocha';
// import * as assert from 'assert';
// import * as twilioLib from '../lib/twilio';
// import { Database, serviceList, getAvailableTimes } from '../lib/database';

// describe('User message interface', () => {
//     const UserMessage = new twilioLib.UserMessages()

//     const sampleServices = [
//         {
//             service: 'Adult Haircut',
//             price: 25,
//             duration: 45
//         },
//         {
//             service: 'Child Haircut',
//             price: 15,
//             duration: 30,
//         },
//     ]
//     const sampleBarberAvailableTimes = [
//         'Sat, August 24th, 4:30pm',
//         'Sat, August 24th, 4:45pm',
//         'Sat, August 24th, 5:00pm',
//         'Sat, August 24th, 5:15pm',
//         'Sat, August 24th, 5:30pm',
//     ]
//     const sampleBarber = 'Kelly'
//     const sampleTime = '2023-09-09 13:00'
//     const sampleTotal = 40

//     it('getRandomAgreeWord', () => {
//         const getdAgreeWord = UserMessage.getRandomAgreeWord()
//         const isAgreeWordValid = UserMessage.agreeWords.find(agreeWord => getdAgreeWord === agreeWord)
//         assert.equal(!!isAgreeWordValid, true)
//     })
//     it('getRandomGreeting', () => {
//         const getdGreeting = UserMessage.getRandomGreeting()
//         const isGreetingValid = UserMessage.introGreetingWords.find(greeting => getdGreeting === greeting)
//         assert.equal(!!isGreetingValid, true)
//     })

//     describe('getTextInterfaceMessage', () => {
//         it('should get the appropriate text interface message', () => {
//             const message = UserMessage.getTextInterfaceMessage();
//             const expectedMessage = `Welcome to the Barber Sharp help interface. How can I help you today? Press:\n\n(1) Book Appointment Online\n(View) View Appointments`
//             assert.equal(message, expectedMessage)
//         })
//     })
//     describe('getConfirmationMessage', () => {
//         it('should create a confirmation message and include appointment confirmation', () => {
//             const confirmationMessage = UserMessage.getConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, false)
//             const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
//             const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

//             assert.equal(!!confirmationMessage, true)
//             assert.equal(doesStringIncludeAppointmentConfirmation, true)
//         })
//         it('should create a confirmation message without appointment confirmation', () => {
//             const confirmationMessage = UserMessage.getConfirmationMessage(sampleServices, sampleBarber, sampleTime, sampleTotal, true)
//             const stringIncludedToConfirmMessage = '\n\nDoes this look correct? Press:\n(1) for YES\n(2) for NO'
//             const doesStringIncludeAppointmentConfirmation = confirmationMessage.includes(stringIncludedToConfirmMessage)

//             assert.equal(!!confirmationMessage, true)
//             assert.equal(doesStringIncludeAppointmentConfirmation, false)
//         })
//         it('without selecting a service we should not be able to send confirmation message', () => {
//             assert.throws( function() { UserMessage.getConfirmationMessage([], sampleBarber, sampleTime, sampleTotal, true) }, Error );
//         })
//         it('without selecting a barber we should not be able to send confirmation message', () => {
//             assert.throws( function() { UserMessage.getConfirmationMessage(sampleServices, '', sampleTime, sampleTotal, true) }, Error );
//         })
//         it('without selecting a time we should not be able to send confirmation message', () => {
//             assert.throws( function() { UserMessage.getConfirmationMessage(sampleServices, sampleBarber, '', sampleTotal, true) }, Error );
//         })
//         it('without selecting a total we should not be able to send confirmation message', () => {
//             assert.throws( function() { UserMessage.getConfirmationMessage(sampleServices, sampleBarber, sampleTime, 0, true) }, Error );
//         })
//     })
//     describe('getReminderMessage', () => {
//         it('should create a reminder message', () => {
//             const reminderMessage = UserMessage.getReminderMessage(sampleServices, sampleBarber, sampleTime, sampleTotal)
//             const expectedReminderMessage = `REMINDER:
// Your appointment is less than an hour away.
// Service: 
// Adult Haircut,
// Child Haircut 

// Barber: Kelly
// Time: Saturday, September 9th, 1:00 pm
// Total: $40`
//             assert.equal(reminderMessage, expectedReminderMessage)
//         })
//         it('without selecting a service we should not be able to receive a reminder message', () => {
//             assert.throws( function() { UserMessage.getReminderMessage([], sampleBarber, sampleTime, sampleTotal) }, Error );
//         })
//         it('without selecting a barber we should not be able to receive a reminder message', () => {
//             assert.throws( function() { UserMessage.getReminderMessage(sampleServices, '', sampleTime, sampleTotal) }, Error );
//         })
//         it('without selecting a time we should not be able to receive a reminder message', () => {
//             assert.throws( function() { UserMessage.getReminderMessage(sampleServices, sampleBarber, '', sampleTotal) }, Error );
//         })
//         it('without selecting a total we should not be able to receive a reminder message', () => {
//             assert.throws( function() { UserMessage.getReminderMessage(sampleServices, sampleBarber, sampleTime, 0) }, Error );
//         })
//     })
//     describe('getAvailableServicesMessage', () => {
//         it('should be able to get available services message', () => {
//             const servicesMessage = UserMessage.getAvailableServicesMessage()
//             let message = `What type of service would you like today? \n\nPress multiple numbers with spaces for multiple services \nEx. 1 3 10 or 1,3,10`
//             for (let prop in serviceList) {
//                 message += `\n\n(${prop}) for ${serviceList[prop].service}\nPrice - $${serviceList[prop].price}\nTime - ${serviceList[prop].duration}mins`
//             }
//             assert.equal(servicesMessage, message)
//         })
//     })
//     describe('getGetBarberAvailableTimesMessage', () => {
//         it('should be able to get a message containing all of the barbers available times', () => {
//             const availableTimesMessage = UserMessage.getGetBarberAvailableTimesMessage(sampleBarberAvailableTimes)
//             let message = `Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
//             assert.equal(availableTimesMessage, message)
//         })
//         it('should not get correct message', () => {
//             const availableTimesMessage = UserMessage.getGetBarberAvailableTimesMessage(sampleBarberAvailableTimes)
//             let message = `Here are their available times\nPress:${[]}`
//             assert.equal(availableTimesMessage === message, false)
//         })
//     })
//     describe('getErrorValidatingAppointmentTime', () => {
//         const sampleBarberAvailableTimes = [
//             'Sat, August 24th, 4:30pm',
//             'Sat, August 24th, 4:45pm',
//             'Sat, August 24th, 5:00pm',
//             'Sat, August 24th, 5:15pm',
//             'Sat, August 24th, 5:30pm',
//         ]
//         it('should be able to get a message containing all of the barbers available times', () => {
//             const availableTimesMessage = UserMessage.getErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
//             let message = `You must choose a valid response. Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
//             assert.equal(availableTimesMessage, message)
//         })
//         it('should not get correct message', () => {
//             const availableTimesMessage = UserMessage.getErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
//             let message = `Here are their available times\nPress:${[]}`
//             assert.equal(availableTimesMessage === message, false)
//         })
//     })
//     describe('getErrorValidatingAppointmentTime', () => {
//         const sampleBarberAvailableTimes = [
//             'Sat, August 24th, 4:30pm',
//             'Sat, August 24th, 4:45pm',
//             'Sat, August 24th, 5:00pm',
//             'Sat, August 24th, 5:15pm',
//             'Sat, August 24th, 5:30pm',
//         ]
//         it('should be able to get a message containing all of the barbers available times', () => {
//             const availableTimesMessage = UserMessage.getErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
//             let message = `You must choose a valid response. Here are their available times\nPress:${sampleBarberAvailableTimes.map((slot, i) => `\n\n(${i + 1}) \n${slot}`)}`
//             assert.equal(availableTimesMessage, message)
//         })
//         it('should not get correct message', () => {
//             const availableTimesMessage = UserMessage.getErrorValidatingAppointmentTime(sampleBarberAvailableTimes)
//             let message = `Here are their available times\nPress:${[]}`
//             assert.equal(availableTimesMessage === message, false)
//         })
//     })
//     it('confirmedAppointmentMessage', () => {
//         const confirmedAppointmentMessage = `Great! We are looking forward to seeing you!\n\nIf you would like to view your appointments \nText: (View)`
//         assert.equal(UserMessage.confirmedAppointmentMessage, confirmedAppointmentMessage)
//     })
//     it('chooseAppointmentTypeMessage', () => {
//         const chooseAppointmentTypeMessage = `Would you like to book the first available time, book an appointment for today or book for a later date? \nPress: \n(1) First available time\n(2) Book an appointment for today\n(3) Later date`;
//         assert.equal(UserMessage.chooseAppointmentTypeMessage, chooseAppointmentTypeMessage)
//     })
//     it('friendlyFormat', () => {
//         const friendlyFormat = 'ddd, MMMM Do, h:mm a'
//         assert.equal(UserMessage.friendlyFormat, friendlyFormat)
//     })
//     it('errorConfirmingAppointmentMessage', () => {
//         const errorConfirmingAppointmentMessage = `Okay, let's fix it. Just text me when you are ready to restart.\nPress: \n(1) First available appointment time\n(2) Book an appointment for today\n(3) Later date`
//         assert.equal(UserMessage.errorConfirmingAppointment, errorConfirmingAppointmentMessage)
//     })
//     it('errorValidatingConfirmingAppointment', () => {
//         const errorValidatingConfirmingAppointment = `You must choose a valid response. Press:\n(1) for YES\n(2) for NO`
//         assert.equal(UserMessage.errorValidatingConfirmingAppointment, errorValidatingConfirmingAppointment)
//     })
// })


// describe('scheduling appointments', () => {
//     // Database.setBarberShopData({}, {
//     //     sendStatus: () => {}
//     // }, () => {})

//     const exampleBarber = {
//         phoneNumber: '',
//         email: '',
//         name: '',
//         appointments: [
//             {
//                 phoneNumber: '',
//                 firstName: '',
//                 uuid: '',
//                 details: {
//                   services: [],
//                   time: {
//                     from: '2019-15-10 10:00',
//                     to: '2019-15-10 11:00'
//                   },
//                   total: 60
//                 }
//             }
//         ],
//         unavailabilities: {
//             lunch: {
//                 from: '10:00',
//                 to: '10:30'
//             },
//             offDays: [
//                 {
//                     from: '2019-12-10',
//                     to: '2019-12-11'
//                 }
//             ],
//             vacations: [],
//             unavailableTimes: []
//         }
//     }

//     describe('getAvailableTimes', () => {
//         it('should not be able to book an appointment during a lunch time', () => {
//             const availableTimes = getAvailableTimes(30, 15, [], '2019-12-12', '2019-12-13', (exampleBarber as any))
//             const timesThatShouldBeUnavailable = availableTimes.filter(availableTime => availableTime.time === '10:00' || availableTime.time === '10:15');
//             const expectedTimeAvailability = [ 
//                 { time: '10:00', available: false, reference: null },
//                 { time: '10:15', available: false, reference: null } 
//             ]
//             assert.deepEqual(timesThatShouldBeUnavailable, expectedTimeAvailability)
//         })
//         it('should be able to book an appointment if it is not lunch time or off day', () => {
//             const availableTimes = getAvailableTimes(30, 15, [], '2019-12-12', '2019-12-13', (exampleBarber as any))
//             const timesThatShouldBeUnavailable = availableTimes.filter(availableTime => availableTime.time === '10:30' || availableTime.time === '11:00');
//             const expectedTimeAvailability = [ 
//                 { time: '10:30', available: true, reference: null },
//                 { time: '11:00', available: true, reference: null } 
//             ]
//             assert.deepEqual(timesThatShouldBeUnavailable, expectedTimeAvailability)
//         })
    
//         it('should not be able to book an appointment during an off day', () => {
//             const availableTimes = getAvailableTimes(30, 15, [], '2019-12-10', '2019-12-11', (exampleBarber as any))
//             const areAllTimesUnavailable = availableTimes.every(availableTime => availableTime.available === false)
//             assert.equal(areAllTimesUnavailable, true)
//         })
//     })
//     // describe('getBarberAppointments', () => {
//     //     it.only('should not be able to book an appointment during a lunch time', () => {
//     //         const barberAppointments = twilioLib.getBarberAppointments(sampleService, (exampleBarber as any));
//     //         console.log(barberAppointments, 'barberAppointments')
//     //     })
//     //     it('should be able to book an appointment if it is not lunch time or off day', () => {
//     //     })
    
//     //     it('should not be able to book an appointment during an off day', () => {
//     //     })
//     // })
// })