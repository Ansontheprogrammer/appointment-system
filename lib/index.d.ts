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

  export type DETAILS = {
    services: any[],
    time: { 
      duration: number, 
      from: string 
    },
    total: number
  }

  export type BARBER_APPOINTMENTS = {
    phoneNumber: string,
    firstName: string,
    uuid?: string,
    details: {
      services: SERVICES[],
      time: ALLOCATED_TIMES,
      total: number
    }
  }
  
  export type BARBER_AVAILBILITY = {
    sunday? : {
      from: string,
      to: string,
    },
    monday? : {
      from: string,
      to: string,
    },
    tuesday? : {
      from: string,
      to: string,
    },
    wednesday? : {
        from: string,
        to: string,
    },
    thursday? : {
        from: string,
        to: string,
    },
    friday? : {
        from: string,
        to: string,
    },
    saturday? : {
        from: string,
        to: string,
    }
 }

  type DAY = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  export type UNAVAILABLETIMES = {
    from: string
    to: string
  }

  export type SERVICES = {
    service: string,
    price?: number,
    duration: number
}
