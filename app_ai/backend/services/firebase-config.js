// firebase-config.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceaccountkey.json');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // The databaseURL isn't required for Firestore operations, but including it for completeness
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('Firebase initialized successfully with project:', serviceAccount.project_id);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

const db = admin.firestore();

module.exports = {
  admin,
  db
};