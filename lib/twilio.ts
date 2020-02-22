import config from '../config/config'
import twilio from 'twilio'
export const client: any = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
)
export const VoiceResponse = (twilio as any).twiml.VoiceResponse
export const MessagingResponse = (twilio as any).twiml.MessagingResponse

export async function cancelRecentAppointment(req, res) {
  let message;
  // if the customer has a uuid that means they have appointments in the database
  if (!!req.customer.uuid) {
    const { phoneNumber, uuid } = req.customer
    const url = `${req.barberShopInfo.barberShopURL}/client?phoneNumber=${phoneNumber}&uuid=${uuid}`
    message = `Here's a link to cancel your appointment \n${url}`
  }
  else {
    message = `Hey, seems like you haven't booked an appointment with anyone. \nYou need to book an appointment first before trying to cancel one.`
  }
  sendText(message, req.customer.phoneNumber)
}


export async function notifyCustomerAboutFeeOnTheirNextVisit(req, res, next) {
  const { amountOfTimesTheyHaveCanceled, customerPhoneNumber } = req.body
  let message;
  if (amountOfTimesTheyHaveCanceled === 0) {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged a $10 fee on your next visit.`
  } else {
    message = `You've recently had an appointment at the Fades of Gray and you didn't call or cancel your appointment.\nYou will be charged the total cost of your service on your next visit.`
  }
  try {
    await sendText(message, customerPhoneNumber)
  } catch(err) { next(err) }

  res.sendStatus(200)
}

export function sendTextMessageBlast(req, res, next) {
  const { message } = req.body
    let customerPhoneNumbersToBlastToo;
    if (process.env.NODE_ENV === 'development') {
      customerPhoneNumbersToBlastToo = ['9082097544']
    } else {
      const phoneNumbersToBlast = req.barber.appointments.map(appointment => appointment.phoneNumber)
      customerPhoneNumbersToBlastToo = ArrNoDupe(phoneNumbersToBlast);
    }
    // Send blast text message 
    const sendBlastTextMessagePromises = customerPhoneNumbersToBlastToo.map((phoneNumber: string) => {
      return sendText(message, phoneNumber)
    });

    Promise.all(sendBlastTextMessagePromises)
    .then(() => res.sendStatus(200), next)
}

export function sendNotification(req, res, next) {
  const { notification } = req.params
  switch(notification){
    case 'textBlast': 
      return sendTextMessageBlast(req, res, next)
    case 'noCallNoShow':
      return notifyCustomerAboutFeeOnTheirNextVisit(req, res, next)
  }
}

function ArrNoDupe(a) {
  var temp = {};
  for (var i = 0; i < a.length; i++)
    temp[a[i]] = true;
  var r = [];
  for (var k in temp)
    r.push(k);
  return r;
}

export async function sendText(message: string, toPhoneNumber: string, fromPhoneNumber?: string) {
  let twilioNumberToUse = process.env.NODE_ENV === 'develop' ? '+16124393345' : fromPhoneNumber

  return await client.messages.create({
    from: twilioNumberToUse,
    body: message,
    to: toPhoneNumber
  }).then(() => { return })
}