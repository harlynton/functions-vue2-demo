/* eslint-disable linebreak-style */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */

const { addData } = require("./addData");
const { unzipFile } = require("./unzipFile");

// Exporta las funciones para que Firebase las reconozca
exports.addData = addData;
exports.unzipFile = unzipFile;
