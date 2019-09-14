import * as twilioLib from '../lib/twilio'

// store a variable containing if the shop is closed or not.
export const shopIsClosed = (() => {
    const currentTime = new Date().getHours()
    return (
      currentTime < parseInt(twilioLib.barberShopAvailablilty.open) ||
      currentTime > parseInt(twilioLib.barberShopAvailablilty.closed)
    )
  })()
  
  export function phoneNumberFormatter(phoneNumber: string) {
    if (phoneNumber[0] === '+') return phoneNumber.slice(2)
    if (phoneNumber[0] === '1') return phoneNumber.slice(1)
    return phoneNumber
  }
  
  export function extractText(body: string): string {
    return String(body.match(/\w+/gi))
  }
  
  export function validateMessage(body: string, validResponses: string[]) {
    let extractedNumber
    extractedNumber = body.match(/\d/gi)
  
    if (!extractedNumber) return false
    extractedNumber = extractedNumber[0]
    return validResponses.includes(extractedNumber)
  }
  
  export function extractedNumbers(body: string) {
    const extractedNumbers = body.match(/\d/gi)
    if (extractedNumbers.length === 1) {
      if (extractedNumbers[0].length > 1) return extractedNumbers[0].split('')
      else return extractedNumbers
    }
    return extractedNumbers
  }