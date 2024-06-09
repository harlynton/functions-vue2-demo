/* eslint-disable linebreak-style */
// initFirestore.js
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const firestore = admin.firestore();

if (process.env.FUNCTIONS_EMULATOR) {
  firestore.settings({
    host: "localhost:8080",
    ssl: false,
  });
}

// eslint-disable-next-line object-curly-spacing
module.exports = { admin, firestore };
