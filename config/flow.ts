import * as twilioLib from '../lib/twilio'
const textSystem = new twilioLib.TextSystem()

const steps = {
  // This object will contain the appropriate function in respect to the customer's step number
  '1': textSystem.textGetName,
  '2': textSystem.textChooseService,
  '3': textSystem.textAdditionalService,
  '4': textSystem.textGetAppointmentType
}

const walkinSteps = {
  '1': textSystem.textChoseApproximateTime,
  '2': textSystem.textChoseExactTime,
  '3': textSystem.textConfirmAppointmentTime,
  '4': textSystem.textGetConfirmation,
  '5': textSystem.textGetName,
}

const bookSteps = {
  '1': textSystem.textChoseApproximateTime,
  '2': textSystem.textChoseExactTime,
  '3': textSystem.textConfirmAppointmentTime,
  '4': textSystem.textGetConfirmation,
  '5': textSystem.textGetName,
}
export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  return steps[req.customer.stepNumber](req, res, next)
}
