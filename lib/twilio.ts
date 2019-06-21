import config from '../config/config';
import twilio from 'twilio';
import { Database } from './database';

export const client: any = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
export const VoiceResponse = (twilio as any).twiml.VoiceResponse;
export const MessagingResponse = (twilio as any).twiml.MessagingResponse;
export const database = new Database()

export const getTextMessageTwiml = (res: any) => {
    return (message: string) => {
        const msg = new MessagingResponse();
        msg.message(message)
        res.writeHead(200, {'Content-Type': 'text/xml'});
        return res.end(msg.toString());
    }
}


export function extractText(body: string): string {
    return String(body.toLowerCase().match(/\w+/g))
}

export function phoneAppointmentFlow(req, res, next) {
     // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
        action: '/api/bookAppointment',
        method: 'POST',
        numDigits: 1
    });
    gather.say('Hey, thank you for calling fades of gray!. We would love to service you today. Press one to book an appointment, Press two to speak to a barber', 
    { voice: 'Polly.Joanna' })
    
    // Render the response as XML in reply to the webhook request
    res.send(twiml.toString());
}

export function bookAppointment(req, res, next) {
    const keyPress = res.req.body.Digits
    // Use the Twilio Node.js SDK to build an XML response
   const twiml = new VoiceResponse();
    const gather = twiml.gather({
        action: '/api/chosenBarber',
        method: 'POST',
        numDigits: 1
    });

    if(keyPress === '1'){
        gather.say('Great! Which barber would you like to use today? Press one for Julian, Press two for Anthony, Press 3 for Antadre', 
        { voice: 'Polly.Joanna' })
        return res.send(twiml.toString());
    } else if(keyPress === '2'){
        twiml.say(`Okay I'm connecting you to the shop right now.`, { voice: 'Polly.Joanna' })
        twiml.dial('6128796369');
          res.set('Content-Type', 'text/xml');
          return res.send(twiml.toString());
    } else {
        twiml.redirect('/api/phoneAppointmentFlow')
        return res.send(twiml.toString());
    }
}

export function chosenBarber(req, res, next) {
    const keyPress = res.req.body.Digits
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
        action: '/api/confirmation',
        method: 'POST',
        numDigits: 1
    });

    if(keyPress === '1'){
        gather.say('Awesome! Julian will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm', 
        { voice: 'Polly.Joanna' })
        return res.send(twiml.toString());
    } else if(keyPress === '2'){
        gather.say('Awesome! Anthony will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm', 
        { voice: 'Polly.Joanna' })
        return res.send(twiml.toString());
    } else if(keyPress === '3'){
        gather.say('Awesome! Antadre will be excited. Press 1 to book for 11am to 12pm, 2 for 12pm to 1pm, 3 for 1pm to 2pm, 4 for 2pm to 3pm, 5 for 3pm to 4pm, 6 for 4pm to 5pm, 7 for 6pm to 7pm, or 8 for 7pm to 8pm', 
        { voice: 'Polly.Joanna' })
        return res.send(twiml.toString());
    }
}

export function confirmation(req, res, next) {
    const customerPhoneNumber = phoneNumberFormatter(res.req.body.From)
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();
    twiml.say('Okay so I will be sending you a confirmation text about your appointment. Thank you for working with us today. Goodbye', { voice: 'Polly.Joanna' })
    res.send(twiml.toString())
    client.messages
      .create({
          from: config.TWILIO_PHONE_NUMBER, 
          body: 'This is a confirmation text from Fades of Gray about your appointment', 
          to: customerPhoneNumber})
}

export function errorMessage(req, res, next) {
    console.log(res, 'in booking appointment response')
    // Use the Twilio Node.js SDK to build an XML response
   const twiml = new VoiceResponse();

   twiml.say('That was an invalid response', { voice: 'Polly.Joanna' })
   twiml.redirect('/api/phoneAppointmentFlow')
   // Render the response as XML in reply to the webhook request
   res.send(twiml.toString());
   res.sendStatus(200);
}

export async function textMessageFlow(req, res, next){
    const customer =  await database.findBarberInDatabase(phoneNumberFormatter(req.body.From))
    if(!customer) {
        const sendTextMessage = getTextMessageTwiml(res)
        return sendTextMessage('Sorry it appears that you are not signed up to Sale Hogs Text alerts')
    } else {
        req.customer = customer;
        next()
    }
}

export function phoneNumberFormatter(phoneNumber: string){
    if(phoneNumber[0] === '+') return phoneNumber.slice(2);
    if(phoneNumber[0] === '1') return phoneNumber.slice(1);
    return phoneNumber
}