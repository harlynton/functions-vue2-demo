/* eslint-disable linebreak-style */
/* eslint-disable comma-dangle */
/* eslint-disable linebreak-style */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */

// unzipFile.js
const functions = require("firebase-functions");
// const { admin } = require("./initFirestore");
const AdmZip = require("adm-zip");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");

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
