const request = require('request')

let url;
url = `https://eclipperz.onrender.com/api/setBarberShopData`

request.post(url).form({
    barberShopName: 'barberSharp.',
    friendlyName: 'Anson Ervin Inc.',
    url: 'ansonervin.com',
    phoneVoice: 'Polly.Salli',
    twilioNumber: '+16124393345',
    shopPhoneNumber: '2012071177',
    shopAvailability: JSON.stringify({
        tuesday : {
            from: '5',
            to: '19',
        },
        wednesday : {
            from: '5',
            to: '19',
        },
        thursday : {
            from: '5',
            to: '19',
        },
        friday : {
            from: '5',
            to: '17',
        },
        saturday : {
            from: '5',
            to: '15',
        }
    }),
    serviceList: JSON.stringify({
        1: {
          service: 'Basic Website',
          price: 45,
          duration: 45
        },
        2: {
          service: 'Mobile app',
          price: 22,
          duration: 30,
        },
        3: {
            service: 'Luxury Website',
            price: 45,
            duration: 45
          },
    })
  })
