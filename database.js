var database = function(name, connection) {
  this._connection = connection;
  this._name = name;
};


/**
 * checks if a database exists
 *
 * @param {function(error, exists)} callback function that will be called,
 *     after we had the information if the database exists or not
 */
database.prototype.exists = function(callback) {
  this.getInfo(function(error, response) {
    if (response !== null) {
      if (response.error) {
        response = false;
      } else {
        response = true;
      }
    }

    callback(error, response);
  });
};


/**
 * gets a single document
 *
 * @param {string} documentID id for the couch document
 * @param {string|function(error, document)} revisionOrCallback
 *     document revision id or function that will be called, after we have the
 *     document, or there was an error
 * @param {function(error, document)} callback function that will be called,
 *     after we have the document, or there was an error
 */
database.prototype.get = function(documentID, revisionOrCallback, callback) {
  var callback = (typeof(revisionOrCallback) === 'function') ?
                 revisionOrCallback :
                 callback,
      revision = (typeof(revisionOrCallback) === 'string') ?
                 '?rev=' + revisionOrCallback :
                 '';

  this._connection.request(
    'GET',
    this._name + '/' + documentID + revision,
    callback
  );
};


/**
 * gets info about a database
 *
 * @param {string} name name of the database
 * @param {function(error, response)} callback function that will be called
 *     after response or error
 */
database.prototype.getInfo = function(callback) {
  this._connection.request('GET', this._name, callback);
};


/**
 * retrieves a view
 *
 * @param {string} designDoc name of the design document (after the "_design/")
 * @param {string} viewName name of the view
 * @param {function(error, result)} callback function that will be called
 *     after getting a result or there was an error
 * @param {Object} options additional view options as key-value-pairs,
 *     look at the couchdb view api documentation for correct parameters
 */
database.prototype.view = function(designDoc, viewName, callback, options) {
  var path = this._name + '/_design/' + designDoc + '/_view/' + viewName,
      query = '',
      options = options || {},
      optionKey;

  for (optionKey in options) {
    query += ((query.length > 0) ? '&' : '?') +
             optionKey + '=' +
             encodeURIComponent(options[optionKey]);
  }

  this._connection.request(
    'GET',
    path + query,
    callback
  );
};


exports.database = database;