// import { phoneNumberFormatter, 
//   shopIsClosed, 
//   validateMessage,
//   getDate,
//   extractedNumbers, 
//   } from '../../config/utils'
// import { 
//   database, 
//   getBarberAppointments, 
//   UserMessage, 
//   sendBookLaterDateLink,
//   UserMessageInterface,
//   VoiceResponse,
//   client
// } from '../twilio'

// import { 
//   barbersInShop, 
//   Database, 
//   serviceList, 
//   friendlyShopName, 
//   automatedVoice,
//   twilioPhoneNumber,
//   barberShopPhoneNumber} from '../database'
// import moment from 'moment';
// import { BARBER } from '../'
// import { createJob } from '../cron'

// export class PhoneSystem extends UserMessageInterface {
//   public static callBarbershop(req, res, twiml) {
//     let phoneNumber = process.env.NODE_ENV === 'development' ? '9082097544' : req.session.barberShopInfo.shopPhoneNumber
//     twiml.dial(phoneNumber)
//     return res.send(twiml.toString())
//   }

//   public static sayMessageToClient(req, res, twiml, message){
//     twiml.say(message, { voice: req.session.barberShopInfo.phoneVoice })
//     return res.send(twiml.toString())
//   }

//     public async phoneAppointmentFlow(req, res, next) {
//       const phoneNumber = phoneNumberFormatter(res.req.body.From)
//       const twiml = new VoiceResponse()
//       /*
//           if shop is closed currently send shop is closed message
//           sending twiml before creating gather twiml to avoid latency issues
//       */
//       if (shopIsClosed()) {
//         twiml.say(
//           `The shop is closed currently. I'm sending you a link to book an appointment at a later date`,
//           {
//             voice: automatedVoice
//           }
//         )
//         res.send(twiml.toString())
//         sendBookLaterDateLink(phoneNumber)
//         return
//       }
      
//       let gather, chooseServiceMessage;
//       let message = ``
//       for (let prop in serviceList) {
//         message += `(${prop}) for ${serviceList[prop].service}\n`
//       }

//       if(Object.keys(serviceList).length <= 10){
//         gather = twiml.gather({
//           action: '/api/chooseService',
//           method: 'POST',
//           finishOnKey: '#',
//           timeout: 3
//         })
//         chooseServiceMessage = `Thank you for calling ${friendlyShopName}!. What type of service would you like? Please choose one or more of the following. Press pound when your finish. ${message}`
//       } else {
//         gather = twiml.gather({
//           action: '/api/chooseService',
//           method: 'POST',
//           timeout: 5
//         })
//         chooseServiceMessage = `Thank you for calling ${friendlyShopName}!. What type of service would you like? ${message}`
//       }
    
//       gather.say(
//         chooseServiceMessage,
//         { voice: automatedVoice }
//       )
      
//       const customer = await database.findCustomerInDatabase(phoneNumber)

//       if (!customer) await database.createCustomer(phoneNumber)
//       res.send(twiml.toString())
//     }

//     public async chooseService(req, res, next) {
//       const keyPress = res.req.body.Digits
//       const twiml = new VoiceResponse()
  
//       // Handle if we have a redirect, we want to check if key press is truthy first
//       if (!!keyPress)
//         if (keyPress[0] === '0') return PhoneSystem.callBarbershop(res, next)
  
//       const phoneNumber = phoneNumberFormatter(res.req.body.From)
//       const gather = twiml.gather({
//         action: '/api/chosenBarber',
//         method: 'POST',
//         numDigits: 1
//       })
  
//       if (res.req.query.redirect) {
//         const barbersWithoutTakenBarber = barbersInShop.filter(
//           barber => barber !== res.req.query.barber
//         )
//         gather.say(
//           `Which barber would you like today? ${barbersWithoutTakenBarber.map(
//             (barber, index) => `Press ${index + 1} for ${barber}`
//           )}`,
//           { voice: automatedVoice }
//         )
//         return res.send(twiml.toString())
//       }
  
//       let services = [],
//         total = 0
  
//       if (!!keyPress) {
//         extractedNumbers(keyPress).forEach(n => {
//           const service = serviceList[n].service
//           const price = serviceList[n].price
//           const duration = serviceList[n].duration
//           services.push({ service, duration })
//           total += price
//         })
  
//         const phoneSession = { services, total }
  
//         try {
//           await database.updateCustomer(phoneNumber, { phoneSession })
//           gather.say(
//             `${UserMessage.generateRandomAgreeWord()}! So you would like a ${services.map(
//               service => service.service
//             )}. ${UserMessage.generateChooseBarberMessage()}`,
//             { voice: automatedVoice }
//           )
//           return res.send(twiml.toString())
//         } catch (err) {
//           next(err)
//         }
//       } else {
//         gather.say(UserMessage.generateChooseBarberMessage(), {
//           voice: automatedVoice
//         })
//         return res.send(twiml.toString())
//       }
//     }
  
//     public async chosenBarber(req, res, next) {
//       const keyPress = res.req.body.Digits
//       const phoneNumber = phoneNumberFormatter(res.req.body.From)
//       const twiml = new VoiceResponse()
//       // Call shop
//       if (!!keyPress)
//         if (keyPress[0] === '0') return PhoneSystem.callBarbershop(res, next)
  
//       const validResponses = barbersInShop.map((barbers, index) =>
//         (index + 1).toString()
//       )
//       let barberName, validatedResponse
  
//       const gather = twiml.gather({
//         action: '/api/confirmation',
//         method: 'POST',
//         numDigits: 2
//       })
  
//       if (!!keyPress)
//         validatedResponse = validateMessage(keyPress, validResponses)
//       if (!!keyPress)
//         if (!validatedResponse)
//           return this.errorMessage(res, '/api/chooseService')
  
//       const customer = await new Database().findCustomerInDatabase(phoneNumber)
//       // set barber name if this is a redirect
//       if (keyPress === undefined) {
//         barberName = customer.phoneSession.barber
//       } else {
//         barberName = barbersInShop[parseInt(keyPress) - 1]
//       }
  
//       let barber
  
//       try {
//         barber = await database.findBarberInDatabase(barberName)
//       } catch (err) {
//         next(err)
//       }
  
//       const availableTimes = getBarberAppointments(
//         customer.phoneSession.services,
//         barber
//       ).map(time =>
//         moment(time, 'YYYY-MM-DD HH-mm').format(UserMessage.friendlyFormat)
//       )
  
//       if (!availableTimes.length) {
//         twiml.say(`I'm so sorry! ${barberName} is all booked up for the day.`, {
//           voice: automatedVoice
//         })
//         twiml.redirect(
//           { method: 'POST' },
//           `/api/chooseService?redirect=true&barber=${barberName}`
//         )
//         return res.send(twiml.toString())
//       } else {
//         if (keyPress === undefined) {
//           const dayForTimes = moment(
//             availableTimes[0],
//             UserMessage.friendlyFormat
//           ).format('dddd, MMMM Do')
//           gather.say(
//             `${UserMessage.generateRandomAgreeWord()} Here is ${barberName}'s current schedule for ${dayForTimes}. Press:${availableTimes.map(
//               (time, index) =>
//                 `\n\n(${index + 1}) for ${moment(
//                   time,
//                   UserMessage.friendlyFormat
//                 ).format('h:mm')}`
//             )}`,
//             { voice: automatedVoice }
//           )
//         }
//         const dayForTimes = moment(
//           availableTimes[0],
//           UserMessage.friendlyFormat
//         ).format('dddd, MMMM Do')
//         const phoneSession = Object.assign(customer.phoneSession, {
//           barber: barberName
//         })
//         await database.updateCustomer(phoneNumber, { phoneSession })
//         gather.say(
//           `${UserMessage.generateRandomAgreeWord()} Here is ${barberName}'s current schedule for ${dayForTimes}. Press:${availableTimes.map(
//             (time, index) =>
//               `\n\n(${index + 1}) for ${moment(
//                 time,
//                 UserMessage.friendlyFormat
//               ).format('h:mm')}`
//           )}`,
//           { voice: automatedVoice }
//         )
//       }
//       return res.send(twiml.toString())
//     }
  
//     public async confirmation(req, res, next) {
//       const keyPress = res.req.body.Digits
//       const phoneNumber = phoneNumberFormatter(res.req.body.From)
//       // Use the Twilio Node.js SDK to build an XML response
//       const twiml = new VoiceResponse()
//       if (!!keyPress)
//         if (keyPress[0] === '0') return PhoneSystem.callBarbershop(res, next)
  
//       const customer: any = await database.findCustomerInDatabase(phoneNumber)
//       const barber = customer.phoneSession.barber
//       const firstName = customer.firstName
//       const services = customer.phoneSession.services
//       const total = customer.phoneSession.total
//       let time,
//         duration = 0
//       const foundBarber = await (database.findBarberInDatabase(barber) as Promise<
//         BARBER
//       >)
//       const availableTimes = getBarberAppointments(
//         customer.phoneSession.services,
//         foundBarber
//       )
//       time = availableTimes[parseInt(keyPress) - 1]
  
//       if (time === undefined) return this.errorMessage(res, '/api/chosenBarber')
  
//       twiml.say(
//         `${UserMessage.generateRandomAgreeWord()} so I will be sending you a confirmation text about your appointment. Thank you for working with us today`,
//         { voice: automatedVoice }
//       )
//       services.forEach(service => (duration += service.duration))
  
//       res.send(twiml.toString())
  
//       const details = {
//         services,
//         time: { from: time, duration },
//         total
//       }
  
//       const reminderMessage = UserMessage.generateReminderMessage(
//         services,
//         barber,
//         time,
//         total
//       )
//       const confirmationMessage = UserMessage.generateConfirmationMessage(
//         services,
//         barber,
//         time,
//         total,
//         true
//       )
//       try {
//         await database.addAppointment(barber, { phoneNumber, firstName }, details)
  
//         let currDate = getDate()
  
//         const minutes = moment(time, 'h:mm a').format('m')
//         const appointmentHour = moment(time, 'YYYY-MM-DD h:mm a').format('H')
//         const alertHour = parseInt(appointmentHour) - 1
//         let date = currDate.date()
//         createJob(
//           `0 ${minutes} ${alertHour} ${date} ${currDate.month()} *`,
//           phoneNumber,
//           reminderMessage
//         )
//         await database.updateCustomer(phoneNumberFormatter(req.body.From), {
//           time
//         })
//       } catch (err) {
//         next(err)
//       }
  
//       client.messages.create({
//         from: twilioPhoneNumber,
//         body: confirmationMessage,
//         to: phoneNumber
//       })
//     }
  
//     private errorMessage(res, redirectUrl: string) {
//       const twiml = new VoiceResponse()
  
//       twiml.say('That was an invalid response', { voice: automatedVoice })
//       twiml.redirect({ method: 'POST' }, redirectUrl)
//       res.send(twiml.toString())
//     }
//   }