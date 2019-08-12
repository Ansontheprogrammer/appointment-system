import * as twilioLib from '../lib/twilio'
const textSystem = new twilioLib.TextSystem()
const textWalkinSystem = new twilioLib.TextWalkInAppointmentInterface();
const textBookSystem = new twilioLib.TextBookAppointmentInterface();
const steps = {
  // This object will contain the appropriate function in respect to the customer's step number
  '1': textSystem.textGetName,
  '2': textSystem.textGetAppointmentType,
  '3': textSystem.textChooseService,
}

const walkinSteps = {
  '1': textWalkinSystem.textBarberForWalkinAppointment,
  '2': textWalkinSystem.textWalkinSendConfirmation,
}

const bookSteps = {
  '1': textBookSystem.textChoseApproximateTime,
  '2': textBookSystem.textChoseExactTime,
  '3': textBookSystem.textConfirmAppointmentTime,
  '4': textBookSystem.textGetConfirmation,
}
export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  // If appointment type is not truthy we need to send the user throught the general steps
  const { appointmentType, stepNumber, finishedGeneralSteps } = req.customer.session
  
  if(appointmentType && finishedGeneralSteps){
    return appointmentType === 'Walkin' ? 
      walkinSteps[stepNumber](req, res, next) :
      bookSteps[stepNumber](req, res, next)
  } else {
    return steps[stepNumber](req, res, next)
  }
}
