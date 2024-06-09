/* eslint-disable linebreak-style */
/* eslint-disable object-curly-spacing */

const functions = require("firebase-functions");
const { firestore } = require("./initFirestore");

exports.addData = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body;
    await firestore.collection("myCollection").add(data);
    res.send("Data added successfully!");
  } catch (error) {
    res.status(500).send("Error adding data");
  }
});
