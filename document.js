/**
 * document object
 *
 * @constructor
 * @param {string|null} id string if you have document id, null if not
 * @param {cushion.Connection} connection cushion connection object
 * @param {cushion.Database} database cushion database object
 */
var Document = function(id, revision, connection, database) {
  this._id = id;
  this._revision = revision;
  this._connection = connection;
  this._database = database;
  this._body = {};

  this._error = {
    'noId': 'no document id was set',
    'noRevision': 'no revision was set',
    'noSupport': 'currently there is no support for this function'
  };
};


/**
 * gets the body of the document
 *
 * @return {object} document body
 */
Document.prototype.body = function() {
  return JSON.parse(JSON.stringify(this._body));
};


/**
 * copy a document, the document id have to set before, first document at the
 * callback is the current document, second document is the target document
 *
 * @param {string} targetId target document id
 * @param {string|function(error, cushion.Document, cushion.Document)}
 *     targetRevisionOrCallback copy to a specific document revision, or
 *     function that will be called, after copying the document or if there was
 *     error
 * @param {?function(error, cushion.Document, cushion.Document)} callback
 *     function that will be called copying the document or if there was an
 *     error
 */
Document.prototype.copy = function(
  targetId,
  targetRevisionOrCallback,
  callback
) {
  var targetRevision = (callback) ? '?rev=' + targetRevisionOrCallback : '';
  callback = (targetRevision === '') ? targetRevisionOrCallback : callback;

  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_copy', 'reason': this._error.noId},
      null,
      null
    ));
  } else {
    this._connection.request({
      'method': 'COPY',
      'headers': {'Destination': targetId + targetRevision},
      'path': this._database.name() + '/' +
        this._id +
        ((this._revision) ? '?rev=' + this._revision : ''),
      'callback': (function(error, response) {
        if (response) {
          response = this._database.document(response.id, response.rev);
        }

        callback(error, this, response);
      }).bind(this)
    });
  }
};


/**
 * create the document
 *
 * @param {Object} body content of the document
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after document was created, or if there was an error
 */
Document.prototype.create = function(body, callback) {
  this._connection.request({
    'method': (this._id === null) ? 'POST' : 'PUT',
    'path': this._database.name() + ((this._id === null) ? '' : '/' + this._id),
    'body': body,
    'callback': (function (error, response) {
      if (error === null) {
        this._id = response.id;
        this._revision = response.rev;
        this._saveContent(body);
      }

      callback(error, this);
    }).bind(this)
  });
};


/**
 * delete the document, the id and revision have to set before, without it you
 * will get an error
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after deleting the document, or if there was an error
 */
Document.prototype.destroy = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_delete', 'reason': this._error.noId},
      null
    ));
  } else if (this._revision === null) {
    process.nextTick(callback(
      {'error': 'no_delete', 'reason': this._error.noRevision},
      null
    ));
  } else {
    this._connection.request({
      'method': 'DELETE',
      'path': this._database.name() + '/' + this._id + '?rev=' + this._revision,
      'callback': (function(error, response) {
        if (response) {
          this._revision = response.rev;
        }

        callback(error, this);
      }).bind(this)
    });
  }
};


/**
 * loads the document, the id have to set before, without it you will get an
 * error
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after loading the document or if there was an error
 */
Document.prototype.load = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_create', 'reason': this._error.noId},
      null
    ));
  } else {
    this._connection.request({
      'method': 'GET',
      'path': this._database.name() + '/' +
              this._id +
              ((this._revision !== null) ? '?rev=' + this._revision : ''),
      'callback': (function(error, response) {
        if (error === null) {
          // get document content
          this._saveContent(response);
        }

        callback(error, this);
      }).bind(this)
    });
  }
};


/**
 * info about the document
 *
 * @param {function(error, info)} callback function that will called, after
 *     retrieving information, or if there was an error
 */
Document.prototype.info = function(callback) {
  process.nextTick(function() {
    callback({'error': 'no_info', 'reason': this._error.noSupport}, null)
  });
  /*if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_info', 'reason': 'no document id was set'},
      null
    ));
  } else {
    this._connection.request({
      'method': 'HEAD',
      'path': this._database.name() + '/' + this._id,
      'callback': callback
    });
  }*/
};


/**
 * saves content at the document
 *
 * @param {Object} body the new content of the document
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after saving the new content or if there was an error
 */
Document.prototype.save = function(body, callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_save', 'reason': this._error.noId},
      null
    ));
  } else if (this._revision === null) {
    process.nextTick(callback(
      {'error': 'no_save', 'reason': this._error.noRevision},
      null
    ));
  } else {
    this._saveContent(body);

    body._rev = this._revision;

    this._connection.request({
      'method': 'PUT',
      'path': this._database.name() + '/' + this._id,
      'body': body,
      'callback': (function(error, response) {
        if (error === null) {
          this._id = response.id;
          this._revision = response.rev;
        }

        callback(error, this);
      }).bind(this)
    });
  }
};


/**
 * saves the content of a whole document response
 *
 * @param {object} body content of the document
 */
Document.prototype._saveContent = function(body) {
  var key;
  body = JSON.parse(JSON.stringify(body));

  this._body = {};

  for (key in body) {
    if (key[0] === '_') {
      if (key === '_rev') {
        this._revision = body[key];
      }
    } else {
      this._body[key] = body[key];
    }
  }
};


exports.Document = Document;