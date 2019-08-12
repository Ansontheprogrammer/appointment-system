import * as twilioLib from '../lib/twilio'
const textSystem = new twilioLib.TextSystem()
const textWalkinSystem = new twilioLib.TextWalkInAppointmentInterface();
const textBookSystem = new twilioLib.TextBookAppointmentInterface();
const textAdditionalServices = new twilioLib.TextAdditionalServicesInterface();
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

const additionalSteps = {
  '1': textAdditionalServices.textStartAdditionalService,
  '2': textAdditionalServices.textConfirmAdditionalService
}

export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  const { appointmentType, stepNumber, finishedGeneralSteps, additionalServices } = req.customer.session

  // check if user would like additional services
  // If appointment type is not truthy we need to send the user throught the general steps
  if(additionalServices)  return additionalSteps[stepNumber](req, res, next)

  // check if user has finished general steps
  if(appointmentType && finishedGeneralSteps){
    return appointmentType === 'Walkin' ? 
      walkinSteps[stepNumber](req, res, next) :
      bookSteps[stepNumber](req, res, next)
  } else {
    return steps[stepNumber](req, res, next)
  }
}
