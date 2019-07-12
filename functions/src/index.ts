import * as functions from 'firebase-functions';

// // Add the Firebase services that you want to use
import "firebase/firestore";
import "firebase/database";

// const app = firebase.app()
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
// The Firebase Admin SDK to access the Firebase Realtime Database.
import admin from 'firebase-admin'

admin.initializeApp();

// // Take the text parameter passed to this HTTP endpoint and insert it into the
// // Realtime Database under the path /messages/:pushId/original
// exports.addMessage = functions.https.onRequest(async (req, res) => {
//     // Grab the text parameter.
//     const original = req.query.text;
//     // Push the new message into the Realtime Database using the Firebase Admin SDK.
//     const snapshot = await admin.database().ref('/messages').push({original: original});
//     // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//     res.redirect(303, snapshot.ref.toString());
//   });

export default () => functions.firestore
  .document('test/')
  .onCreate(event => {
    const db = admin.firestore();
    const myPost = db.collection('test').doc('user');

    myPost.get()
        .then((doc: any) => {
                // const data = doc.data()
                console.log(doc)
            
        })
  })

