export default {
  barberShopName: 'barberSharp',
  friendlyName: 'Barber Sharp',
  url: 'barber-sharp.netlify.com',
  phoneVoice: 'Polly.Justin',
  twilioNumber: '+16124393345',
  shopPhoneNumber: '949029323',
  shopAvailability: JSON.stringify({
      tuesday : {
          from: '9',
          to: '19',
      },
      wednesday : {
          from: '9',
          to: '19',
      },
      thursday : {
          from: '9',
          to: '19',
      },
      friday : {
          from: '9',
          to: '17',
      },
      saturday : {
          from: '9',
          to: '15',
      }
  }),
  serviceList: JSON.stringify({
      1: {
        service: 'Classic Cut and Hot Lather Shave Combo',
        price: 45,
        duration: 45
      },
      2: {
        service: 'Classic Cut with Famous Razor Finish',
        price: 22,
        duration: 30,
      },
      3: {
        service: 'Skin Fade',
        price: 27,
        duration: 30,
      },
      4: {
        service: 'Shampoo (relax and cleanse) ',
        price: 5,
        duration: 15,
      },
      5: {
        service: 'Child’s Haircut',
        price: 20,
        duration: 30
      },
      6: {
        service: 'Senior’s Haircut',
        price: 15,
        duration: 30
      },
      7: {
        service: 'Gray Blending',
        price: 25,
        duration: 45
      },
      8: {
        service: 'Vigorous Scalp Massage',
        price: 7,
        duration: 30
      },
      9: {
        service: 'Vigorous Scalp Massage with Haircut',
        price: 5,
        duration: 30
      },
      10: {
        service: 'Ultimate Sharp Shave',
        price: 55,
        duration: 90
      },
      11: {
        service: 'Classic Hot Lather Shave',
        price: 35,
        duration: 45
      },
      12: {
        service: 'Head Shave',
        price: 27,
        duration: 45
      },
      13: {
        service: 'Neck Shave',
        price: 5,
        duration: 30
      },
      14: {
        service: 'Beard Trim',
        price: 15,
        duration: 30
      },
      15: {
        service: 'Beard Trim & Haircut',
        price: 29,
        duration: 45
      },
  })
}