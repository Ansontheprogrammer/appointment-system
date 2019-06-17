import config from '../config/config';
import twilio from 'twilio';
import { Database } from './database';

export const client: any = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
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

// export async function correctZipCode(req, res, next){
//     const userMessage: string  = extractText(req.body.Body)
//     const sendTextMessage = getTextMessageTwiml(res);

//     const phoneNumber = phoneNumberFormatter(req.body.From)

//     // Validate that the user responded with a valid zip code
//     const validatedUserResponse = lookup(userMessage);

//     if(!!validatedUserResponse){
//         try {
//             // move user to next step
//             await database.updateCustomer(phoneNumber, 'stepNumber', 3)
//             // update user zip code
//             await database.updateCustomer(phoneNumber, 'zipCode', userMessage)
//             // send text alert deal customization message
//             return sendTextMessage(`Thank you. Now we will begin sending you the best deals in the ${validatedUserResponse.city}, ${validatedUserResponse.state} area via picture message. \n\nEvery Monday at 8am you will receive deals running deals running either Monday, Tuesday, Wednesday or Thursday. \n\nEvery Friday at 8am you will receive deals in your area running throughout Friday, Saturday or Sunday. \n\nThank you for subscribing and enjoy.`)
//         } catch(err) { next(err) }
//     } else return sendTextMessage(`You must enter a valid zip code.`)
// }


export function extractText(body: string): string {
    return String(body.toLowerCase().match(/\w+/g))
}

export async function getCustomerFlow(req, res, next){
    const barber =  await database.findBarberInDatabase(phoneNumberFormatter(req.body.From))
    if(!barber) {
        const sendTextMessage = getTextMessageTwiml(res)
        return sendTextMessage('Sorry it appears that you are not signed up to Sale Hogs Text alerts')
    } else {
        req.barber = barber;
        next()
    }
}

export function phoneNumberFormatter(phoneNumber: string){
    if(phoneNumber[0] === '+') return phoneNumber.slice(2);
    if(phoneNumber[0] === '1') return phoneNumber.slice(1);
    return phoneNumber
}