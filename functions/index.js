/* eslint-disable comma-dangle */
/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const AdmZip = require("adm-zip");
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();
const storage = new Storage();

exports.unzipFile = functions.storage.object().onFinalize(async (object) => {
  const bucket = storage.bucket(object.bucket);
  const filePath = object.name;
  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));

  if (!filePath.endsWith(".zip")) {
    console.log("Not a zip file.");
    return null;
  }

  await bucket.file(filePath).download({ destination: tempFilePath });
  const zip = new AdmZip(tempFilePath);
  const zipEntries = zip.getEntries();

  await Promise.all(
    zipEntries.map(async (zipEntry) => {
      const entryName = zipEntry.entryName;
      const tempEntryPath = path.join(os.tmpdir(), entryName);
      fs.writeFileSync(tempEntryPath, zipEntry.getData());

      const newFilePath = path.join(path.dirname(filePath), entryName);
      await bucket.upload(tempEntryPath, {
        destination: newFilePath,
      });

      fs.unlinkSync(tempEntryPath);
    })
  );

  fs.unlinkSync(tempFilePath);
  console.log("Zip file decompressed successfully.");
  return null;
});
