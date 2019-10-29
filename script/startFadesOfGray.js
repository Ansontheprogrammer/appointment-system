const request = require('request')

let url;
if(process.env.NODE_ENV === 'production'){
  url = `http://localhost:80/api/setBarberShopData`
} else {
  url = `https://appointment-system.onrender.com/api/setBarberShopData`
}

console.log('sending req', url)
request.post({url, form: { 
    barberShopName: 'fadesOfGray',
    friendlyName: 'Fades of Gray',
    url: 'fadesofgray.netlify.com',
    phoneVoice: 'Polly.Salli',
    twilioNumber: '16125023342',
    shopPhoneNumber: '6128796369',
    shopAvailability: JSON.stringify({
        tuesday : {
            from: '10',
            to: '18',
        },
        wednesday : {
            from: '10',
            to: '18',
        },
        thursday : {
            from: '10',
            to: '18',
        },
        friday : {
            from: '10',
            to: '18',
        },
        saturday : {
            from: '9:30',
            to: '17:30',
        }
    }),
    serviceList: JSON.stringify({
        1: {
          service: 'Adult Haircut',
          price: 25,
          duration: 30
        },
        2: {
          service: 'Child Haircut',
          price: 15,
          duration: 30,
        },
        3: {
          service: 'Haircut & Shave',
          price: 35,
          duration: 45,
        },
        4: {
          service: 'Beard Trim',
          price: 15,
          duration: 15,
        },
        5: {
          service: 'Dry Shave',
          price: 10,
          duration: 15
        },
        6: {
          service: 'Razor Face Shave',
          price: 15,
          duration: 30
        },
        7: {
          service: 'Hair Lining',
          price: 10,
          duration: 15
        },
        8: {
          service: 'Mustache Trim',
          price: 7,
          duration: 15
        },
        9: {
          service: 'Shampoo',
          price: 15,
          duration: 15
        }
    })
  }
}, (err, res, body) => {
  if(err) console.error(err, 'err')
  console.log(body, 'body')
})
request.post(url).form({ 
  barberShopName: 'fadesOfGray',
  friendlyName: 'Fades of Gray',
  url: 'fadesofgray.netlify.com',
  phoneVoice: 'Polly.Salli',
  twilioNumber: '16125023342',
  shopPhoneNumber: '6128796369',
  shopAvailability: JSON.stringify({
      tuesday : {
          from: '10',
          to: '18',
      },
      wednesday : {
          from: '10',
          to: '18',
      },
      thursday : {
          from: '10',
          to: '18',
      },
      friday : {
          from: '10',
          to: '18',
      },
      saturday : {
          from: '9:30',
          to: '17:30',
      }
  }),
  serviceList: JSON.stringify({
      1: {
        service: 'Adult Haircut',
        price: 25,
        duration: 30
      },
      2: {
        service: 'Child Haircut',
        price: 15,
        duration: 30,
      },
      3: {
        service: 'Haircut & Shave',
        price: 35,
        duration: 45,
      },
      4: {
        service: 'Beard Trim',
        price: 15,
        duration: 15,
      },
      5: {
        service: 'Dry Shave',
        price: 10,
        duration: 15
      },
      6: {
        service: 'Razor Face Shave',
        price: 15,
        duration: 30
      },
      7: {
        service: 'Hair Lining',
        price: 10,
        duration: 15
      },
      8: {
        service: 'Mustache Trim',
        price: 7,
        duration: 15
      },
      9: {
        service: 'Shampoo',
        price: 15,
        duration: 15
      }
  })
})

// process.exit()