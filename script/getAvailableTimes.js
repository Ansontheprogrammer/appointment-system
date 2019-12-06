const request = require('request')

// store deal
const url = `http://localhost:80/api/getBarberAvailableTimes`

request.post(url)
.form({
    barber: 'Julian',
    fromDate: '2019-01-02',
    toDays: 15,
    services: [{
        duration: 50,
        price: 10
    }]
})
.on('response', (resp, body) => {
    console.log(resp,'resp', body, 'body')
})