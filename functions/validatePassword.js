/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.validatePassword = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://vue2-demo-3b507.web.app");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const { password } = req.body;
  console.log("Received password:", password);

  db.collection("config")
    .doc("passwordDoc")
    .get()
    .then((doc) => {
      if (!doc.exists) {
        console.log("Config document not found");
        return res.status(404).send("Config document not found");
      }

      const correctPassword = doc.data().value;
      console.log("Stored password:", correctPassword);
      if (password === correctPassword) {
        return res.status(200).send({ message: "Password correct" });
      } else {
        console.log("Incorrect password");
        return res.status(401).send({ message: "Incorrect password" });
      }
    })
    .catch((error) => {
      console.error("Error validating password:", error);
      return res.status(500).send("Internal Server Error");
    });
});
