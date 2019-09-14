export type CUSTOMER = {
    phoneNumber: string
    firstName: string
    stepNumber?: string
  }
  
  export type ALLOCATED_TIMES = {
    from: string, 
    duration: number
  }

  export type BARBER = {
    phoneNumber: string
    email: string
    name: string
    appointments: [
      BARBER_APPOINTMENTS
    ],
    unavailabilities: {
      lunch: UNAVAILABLETIMES
      offDays: UNAVAILABLETIMES[],
      vacations: UNAVAILABLETIMES[],
      unavailableTimes: UNAVAILABLETIMES[]
    }
  }

  export type BARBER_APPOINTMENTS = {
    customer: CUSTOMER
    details: {
      time: ALLOCATED_TIMES
      total: number
      duration: number
    }
  }
  
  export type UNAVAILABLETIMES = {
    from: string
    to: string
  }

  export type SERVICES = {
    service: string,
    price?: number,
    duration: number
}
