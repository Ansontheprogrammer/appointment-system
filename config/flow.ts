import * as twilioLib from '../lib/twilio'

const steps = {
  // This object will contain the appropriate function in respect to the customer's step number
  '1': twilioLib.textGetName,
  '2': twilioLib.textChooseService,
  '3': twilioLib.textAdditionalService,
  '4': twilioLib.textChoseBarber,
  '5': twilioLib.textConfirmAppointmentTime,
  '6': twilioLib.textGetConfirmation,
  '7': twilioLib.textGetName
}

export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  return steps[req.customer.stepNumber](req, res, next)
}
