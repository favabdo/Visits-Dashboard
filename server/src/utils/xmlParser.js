const xml2js = require('xml2js');

/**
 * Parse XML string to JSON object.
 * @param {string} xml - XML string
 * @returns {Promise<Object>} - Parsed JSON object
 */
const parseXML = (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { trim: true, explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = { parseXML };
