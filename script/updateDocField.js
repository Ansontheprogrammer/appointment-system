const { Database } = require('../dist/lib/database');
// Get the `FieldValue` object
let FieldValue = require('firebase-admin').firestore.FieldValue;

function updateFields(barbershopName){
    const db = new Database({
      firstCollection: 'barbershops',
      doc: 'barberSharp',
      secondCollection: 'barbers'
    })
    db.db.createAndUpdateOne({
    id: 'fewoinfwon',
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
  console.log(db.db.createAndUpdateOne, 'db')
  }
  updateFields('')