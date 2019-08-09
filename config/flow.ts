import * as twilioLib from '../lib/twilio'

const steps = {
  // This object will contain the appropriate function in respect to the customer's step number
  '1': twilioLib.textGetName,
  '2': twilioLib.textChooseService,
  '3': twilioLib.textAdditionalService,
  '4': twilioLib.textGetAppointmentType
}

const walkinSteps = {
  '1': twilioLib.textChoseApproximateTime,
  '2': twilioLib.textChoseExactTime,
  '3': twilioLib.textConfirmAppointmentTime,
  '4': twilioLib.textGetConfirmation,
  '5': twilioLib.textGetName,
}

const bookSteps = {
  '1': twilioLib.textChoseApproximateTime,
  '2': twilioLib.textChoseExactTime,
  '3': twilioLib.textConfirmAppointmentTime,
  '4': twilioLib.textGetConfirmation,
  '5': twilioLib.textGetName,
}
export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  return steps[req.customer.stepNumber](req, res, next)
}
