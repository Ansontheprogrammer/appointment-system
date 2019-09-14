import { TextSystem, TextBookAppointmentInterface, TextWalkInAppointmentInterface} from '../lib/flow/smsFlow'
const textSystem = new TextSystem
const textWalkinSystem = new TextWalkInAppointmentInterface();
const textBookSystem = new TextBookAppointmentInterface();

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
  '2': textBookSystem.textConfirmAppointmentTime,
  '3': textBookSystem.textGetConfirmation,
}

export function processFlow(req, res, next) {
  // This function will call the necessary step based on the customer's step number
  const { appointmentType, stepNumber, finishedGeneralSteps, additionalServices } = req.customer.session

  // check if user has finished general steps
  if(appointmentType && finishedGeneralSteps){
    return appointmentType === 'Walkin' ? 
      walkinSteps[stepNumber](req, res, next) :
      bookSteps[stepNumber](req, res, next)
  } else {
    return steps[stepNumber](req, res, next)
  }
}
