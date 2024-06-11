/* eslint-disable linebreak-style */
/* eslint-disable comma-dangle */
/* eslint-disable linebreak-style */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */

// unzipFile.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const AdmZip = require("adm-zip");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");

const storage = new Storage();
const db = admin.firestore();

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

  const fileData = [];

  await Promise.all(
    zipEntries.map(async (zipEntry) => {
      const entryName = zipEntry.entryName;
      const tempEntryPath = path.join(os.tmpdir(), entryName);
      fs.writeFileSync(tempEntryPath, zipEntry.getData());

      const newFilePath = path.join(path.dirname(filePath), entryName);
      await bucket.upload(tempEntryPath, {
        destination: newFilePath,
      });

      const fileStats = fs.statSync(tempEntryPath);

      fileData.push({
        nombreArchivo: entryName,
        pesoArchivo: fileStats.size,
        tipoArchivo: path.extname(entryName),
        ultimaModificacionArchivo: fileStats.mtime,
      });

      fs.unlinkSync(tempEntryPath);
    })
  );

  fs.unlinkSync(tempFilePath);

  // Guarda los detalles de los archivos en Firestore
  const batch = db.batch();
  const filesCollectionRef = db.collection("filesData");
  try {
    fileData.forEach((file) => {
      const docRef = filesCollectionRef.doc(); // Crea un nuevo doc en filesData
      batch.set(docRef, file);
    });

    await batch.commit();

    console.log("Zip file decompressed and data stored in Firestore.");
    return null;
  } catch (error) {
    console.log("error =>", error.message);
  }
  console.log("Zip file decompressed successfully.");
  return null;
});
