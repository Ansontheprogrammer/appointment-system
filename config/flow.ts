import * as twilioLib from '../lib/twilio'

const steps = {
    // This object will contain the appropriate function in respect to the customer's step number
    // '1': twilioLib.confirmZipCode,
    // '2': twilioLib.correctZipCode,
    // '3': twilioLib.completedTextAlertSetup
}

export function processFlow(req, res, next){
    // This function will call the necessary step based on the customer's step number
    return steps[req.customer.stepNumber](req, res, next)
}