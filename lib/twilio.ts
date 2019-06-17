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