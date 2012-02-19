var assert = require('assert');


/**
 * this checks only the properties for all request functions
 *
 * @param {object} properties the properties for a request
 * @param {string} method http method to check against properties.method
 * @param {string} path checking against properties.path
 */
module.exports = function(properties, method, path) {
  // check against the http method
  assert.strictEqual(
    properties.method,
    method,
    'http method have to be ' + method
  );

  // checking against the path
  assert.strictEqual(
    properties.path,
    path,
    'path have to be "' + path + '"'
  );

  // check if callback is a function
  assert.strictEqual(
    typeof(properties.callback),
    'function',
    'callback have to be a function'
  );
};