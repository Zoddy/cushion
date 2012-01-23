var database = function(name, connection) {
  this._connection = connection;
  this._name = name;
};


/**
 * create a document
 *
 * @param {string|Object} docIdOrContent document id, if you have a own id, or
 *     content of the document, if you want to create a id by the couchdb
 * @param {Object|function(error, nodecouch.Document)} contentOrCallback content
 *     of the document, if first argument was a own document id or function that
 *     will call, after created the document, or if there was an error
 * @param {?function(error, nodecouch.Document)} callback function that will be
 *     called, after created the document, or if there was an error, only
 *     optional if second argument was the callback
 */
database.prototype.createDocument = function(
  docIdOrContent,
  contentOrCallback,
  callback
) {
  var docId = (typeof(docIdOrContent) === 'string') ? docIdOrContent : null,
      content = (docId === null) ? docIdOrContent : contentOrCallback,
      callback = (docId === null) ? contentOrCallback : callback,
      callbackWrapper = (function(error, response) {
        if (response && !response.error) {
          response = this.document(response.id, response.rev);
        }

        callback(error, response);
      }).bind(this),
      method = (docId === null) ? 'POST': 'PUT',
      path = this._name + '/' + ((docId === null) ? '' : docId);

  this._connection.request(method, path, callbackWrapper, content);
};


/**
 * copy a document
 *
 * @param {string|Object} source id of the document, that will be copied or
 *     object with id and revision
 * @param {string|Object} target id of the target document or object with id and
 *     revision
 * @param {function(error, confirmation)} callback function that will be called,
 *     after document was copied, or if there was an error
 */
database.prototype.copyDocument = function(source, target, callback) {
  var sourceRevision = (typeof(source) === 'object') ?
                       '?rev=' + source.revision :
                       '',
      targetRevision = (typeof(target) === 'object') ?
                       '?rev=' + target.revision :
                       '';

  this._connection.request(
    'COPY',
    this._name + '/' + (source.id || source) + sourceRevision,
    callback,
    null,
    {'Destination': (target.id || target) + targetRevision}
  );
};





/**
 * deletes a document
 *
 * @param {string} docId document id which you want to delete
 * @param {string} revision revision id of the document
 * @param {function(error, confirmation)} callback function that will be called
 *     after document was deleted, or if there was an error
 */
database.prototype.deleteDocument = function(docId, revision, callback) {
  this._connection.request(
    'DELETE',
    this._name + '/' + docId + '?rev=' + revision,
    callback
  );
};


/**
 * creates a document object
 *
 * @param {?string} docId if you have a document id, then set it here
 * @return {nodecouch.Document} the document object
 */
database.prototype.document = function(docId, revision) {
  return new (require('./document.js').Document)(
    docId || null,
    this._connection,
    this
  );
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
 * get all documents in this database
 *
 * @param {function(error, allDocs)} callback function that will be called,
 *     after getting the documents, or if there was an error
 * @param {Object} options additional options as key-value-pairs that are the
 *     same at the views, look at the couchdb view api documentation for correct
 *     parameters
 */
database.prototype.getAll = function(callback, options) {
  var options = options || {},
      query = '',
      optionKey;

  for (optionKey in options) {
    query += ((query.length > 0) ? '&' : '?') +
             optionKey + '=' +
             encodeURIComponent(options[optionKey]);
  }

  this._connection.request('GET', this._name + '/_all_docs/' + query, callback);
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
 * gets the name of the database
 *
 * @return {string} the database name
 */
database.prototype.name = function() {
  return this._name;
};


/**
 * updates a document body
 *
 * @param {string} docId id of the document, which will be updated
 * @param {string} revision current revision of the document
 * @param {Object} body new content of the document
 * @param {function(error, confirmation)} callback function that will be called,
 *     after document was updated, or if there was an error
 */
database.prototype.updateDocument = function(docId, revision, body, callback) {
  body._id = docId;
  body._rev = revision;

  this._connection.request(
    'PUT',
    this._name + '/' + docId,
    callback,
    body
  );
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