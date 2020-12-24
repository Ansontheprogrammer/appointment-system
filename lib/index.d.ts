export type CUSTOMER = {
  id: string;
  phoneNumber: string;
  firstName: string;
  stepNumber?: string;
  phoneSession: {
    barber?: string;
    services?: SERVICES[];
    total: number;
  };
};

export type ALLOCATED_TIMES = {
  from: string;
  duration: number;
};

export type BARBER = {
  id: string;
  phoneNumber: string;
  email: string;
  name: string;
  appointments: [BARBER_APPOINTMENTS];
  unavailabilities: {
    lunch: UNAVAILABLETIMES;
    offDays: UNAVAILABLETIMES[];
    vacations: UNAVAILABLETIMES[];
    unavailableTimes: UNAVAILABLETIMES[];
  };
};

export type DETAILS = {
  services: any[];
  time: {
    duration: number;
    from: string;
  };
  total: number;
};

export type BARBER_APPOINTMENTS = {
  phoneNumber: string;
  firstName: string;
  uuid?: string;
  details: {
    services: SERVICES[];
    time: ALLOCATED_TIMES;
    total: number;
  };
};

export type UNAVAILABLETIMES = {
  from: string;
  to: string;
};

export type SERVICES = {
  service: string;
  price?: number;
  duration: number;
};

export type BARBERSHOP = {
  id: string;
  systemName: string;
  friendlyName: string;
  url: string;
  phoneVoice: string;
  twilioNumber: string;
  shopPhoneNumber: string;
  timezone: string;
  serviceList: [
    {
      service: string;
      price: number;
      duration: number;
    }
  ];
  shopAvailability: {
    tuesday: {
      from: string;
      to: string;
    };
    wednesday: {
      from: string;
      to: string;
    };
    thursday: {
      from: string;
      to: string;
    };
    friday: {
      from: string;
      to: string;
    };
    saturday: {
      from: string;
      to: string;
    };
  };
};
