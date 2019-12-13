const { db } = require('../dist/lib/database');
const eclipperzPhoneNumbers = [
  '9082097544',
  '9739015711',
  '7632382351',
  '9203127891'
]

function findAppointmentsInCustomerCollection(barbershopName){
  const barberShopDoc = db.collection('barbershops').doc(barbershopName);
  const customerCollection = barberShopDoc.collection('customers')
  eclipperzPhoneNumbers.forEach((number) => {
    customerCollection.doc(number).get().then(doc => {
      if(doc.data() !== undefined) {
        console.log('About to delete -', doc.id)
        customerCollection.doc(number).delete().then(function() {
          console.log("Document successfully deleted!");
        }).catch(function(error) {
          console.error("Error removing document: ", error);
        });
      }
    })
  })
}

function findAppointmentsInBarberCollection(barbershopName){
  const barberShopDoc = db.collection('barbershops').doc(barbershopName);
  const barberCollection = barberShopDoc.collection('barbers');
  barberCollection
  .get()
  .then(snapshot => {
    snapshot.docs
    .forEach(doc => {
      const barberDocument = barberCollection.doc(doc.id)
      const barberAppointments = doc.get('appointments')
      const filteredBarberAppointments = barberAppointments.filter(appointment => {
        if(!eclipperzPhoneNumbers.find(number => number === appointment.phoneNumber)){
          return true
        } else { 
          console.log('Found appointment')
          return false 
        }
      })
      barberDocument.update({ appointments: filteredBarberAppointments });
    })
  })
}

function deleteAppointments(barbershopName){
  findAppointmentsInCustomerCollection(barbershopName)
  findAppointmentsInBarberCollection(barbershopName)
}

deleteAppointments('fadesOfGray')