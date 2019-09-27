const request = require('request')

// store deal
const url = `http://localhost:80/api/createBarber`
// fades of gray
request.post(url).form({
    name: 'Julian',
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
    name: 'Anthony',
    email: '',
    appointments: [],
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
    name: 'Jimmy',
    email: '',
    appointments: [],
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

// request.post(url).form({
//     name: 'Jesse',
//     email: '',
//     appointments: [],
//     unavailabilities: {
//         lunch: { from : '13:00', to: '14:00' },
//         vacations: [
//             { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
//         ],
//         offDays: [
//             { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
//         ],
//         unavailableTimes:[
//             { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
//         ]
//     }
// })

// request.post(url).form({
//     name: 'Kelly',
//     email: '',
//     appointments: [],
//     unavailabilities: {
//         lunch: { from : '13:00', to: '14:00' },
//         vacations: [
//             { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
//         ],
//         offDays: [
//             { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
//         ],
//         unavailableTimes:[
//             { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
//         ]
//     }
// })

// request.post(url).form({
//     name: 'Ryan',
//     email: '',
//     appointments: [],
//     unavailabilities: {
//         lunch: { from : '13:00', to: '14:00' },
//         vacations: [
//             { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
//         ],
//         offDays: [
//             { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
//         ],
//         unavailableTimes:[
//             { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
//         ]
//     }
// })

// request.post(url).form({
//     name: 'Steph',
//     email: '',
//     appointments: [],
//     unavailabilities: {
//         lunch: { from : '13:00', to: '14:00' },
//         vacations: [
//             { from: '2019-08-17 00:00', to: '2019-08-18 00:00'}
//         ],
//         offDays: [
//             { from: '2019-08-19 00:00', to: '2019-08-20 00:00'}
//         ],
//         unavailableTimes:[
//             { from: '2019-08-16 12:00', to: '2019-08-16 13:00'}
//         ]
//     }
// })
