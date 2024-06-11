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

// Asegurarse de que Firebase Admin SDK esté inicializado solo una vez
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.unzipFile = functions.storage.object().onFinalize(async (object) => {
  const bucket = storage.bucket(object.bucket);
  const filePath = object.name;
  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));

  if (!filePath.endsWith(".zip")) {
    console.log("Not a zip file.");
    return null;
  }

  try {
    // Descargar el archivo zip
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log(`Downloaded zip file to ${tempFilePath}`);

    // Inicializar AdmZip con el archivo descargado
    const zip = new AdmZip(tempFilePath);
    const zipEntries = zip.getEntries();
    const fileData = [];

    // Procesar cada entrada del zip
    await Promise.all(
      zipEntries.map(async (zipEntry) => {
        const entryName = zipEntry.entryName;
        const tempEntryPath = path.join(os.tmpdir(), entryName);

        // Escribir la entrada en el sistema de archivos temporal
        fs.writeFileSync(tempEntryPath, zipEntry.getData());

        // Determinar la nueva ruta en el bucket
        const newFilePath = path.join(path.dirname(filePath), entryName);

        // Subir el archivo descomprimido al bucket
        await bucket.upload(tempEntryPath, {
          destination: newFilePath,
        });
        console.log(`Uploaded ${entryName} to ${newFilePath}`);

        // Obtener información del archivo
        const fileStats = fs.statSync(tempEntryPath);
        fileData.push({
          nombreArchivo: entryName,
          pesoArchivo: fileStats.size,
          tipoArchivo: path.extname(entryName),
          ultimaModificacionArchivo: fileStats.mtime.toISOString(),
        });

        // Eliminar el archivo temporal
        fs.unlinkSync(tempEntryPath);
      })
    );

    // Eliminar el archivo zip temporal
    fs.unlinkSync(tempFilePath);
    console.log("Zip file decompressed successfully.");

    // Guarda los detalles de los archivos en Firestore
    const batch = db.batch();
    const filesCollectionRef = db.collection("filesData");

    fileData.forEach((file) => {
      const docRef = filesCollectionRef.doc(); // Crea un nuevo doc en filesData
      batch.set(docRef, file);
    });
    console.log("batch: =>", batch._ops);

    await batch.commit();
    console.log("File data stored in Firestore successfully.");
  } catch (error) {
    console.error("Error decompressing and storing data:", error);
  }

  return null;
});
