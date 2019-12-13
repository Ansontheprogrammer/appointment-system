const { db } = require('../dist/lib/database');
// Get the `FieldValue` object
let FieldValue = require('firebase-admin').firestore.FieldValue;

function updateFields(barbershopName){
    const barberShopDoc = db.collection('barbershops').doc(barbershopName);
    const customerCollection = barberShopDoc.collection('customers');
    customerCollection
    .get()
    .then(snapshot => {
      snapshot.docs.forEach(doc => {
          const customerDocument = customerCollection.doc(doc.id)
          customerDocument.update({ 
              cancellations: FieldValue.delete(),
              cancellation: FieldValue.delete(),
              noCallNoShows: []
        })
      })
    })
    .catch(console.error)
  }

  updateFields('fadesOfGray')