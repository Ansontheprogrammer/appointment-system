const request = require('request')

// store deal
const url = `http://localhost:80/api/getBarberAvailableTimes`

request.post({uri: url, form: {
    barber: 'Kelly',
    fromDate: '2019-01-02',
    toDays: 15,
    services: [{
        duration: 50,
        price: 10
    }]
}}, (err, res, body) => {
    console.log(body, 'body')
})