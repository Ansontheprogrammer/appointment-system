const request = require('request')

// store deal
const url = `https://cf7cd00e.ngrok.io/api/createBarber`

request.post(url).form({
    name: 'Idris',
    email: '',
    unavailabilities: {
        lunch: { from : '13:00', to: '14:00' },
        vacations: [
            { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
        ],
        offDays: [
            { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
        ],
        unavailableTimes:[
            { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
        ]
    }
})

request.post(url).form({
    name: 'Kelly',
    email: '',
    unavailabilities: {
        lunch: { from : '13:00', to: '14:00' },
        vacations: [
            { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
        ],
        offDays: [
            { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
        ],
        unavailableTimes:[
            { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
        ]
    }
})

request.post(url).form({
    name: 'Jesse',
    email: '',
    unavailabilities: {
        lunch: { from : '13:00', to: '14:00' },
        vacations: [
            { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
        ],
        offDays: [
            { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
        ],
        unavailableTimes:[
            { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
        ]
    }
})