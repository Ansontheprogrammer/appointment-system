const request = require('request')

// store deal
const url = `https://36ecd9d4.ngrok.io/api/getBarberAvailableTimes`

request.post(url)
    .form({
        barber: 'Julian',
        fromDate: '2019-08-25 00:00',
        toDays: 15,
        services: [{
            duration: 50,
            price: 10
        }]
    })
    .on('response', (resp, body) => {
        console.log(body, 'body')
    })