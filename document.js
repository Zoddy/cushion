// jshint settings
/*global require: false, exports: false, process: false */

var fs = require('fs');


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
    'noFile': 'could not read file'
  };
};


/**
 * gets the body of the document or saves data to it
 * if you want to save data, you can set one argument for each child, e.g.
 * .body('foo', 'bar', 'foobar'); that means you set foo.bar to 'foobar'
 * if there are is no foo.bar it will be created
 * if you set the body and the content argument (the last one) was explicitly
 * set to 'undefined', the property will be deleted
 *
 * @return {object|cushion.Document} get a deep copy of the document body, or
 *     the document, if you save data to the body
 */
Document.prototype.body = function() {
  var obj = Array.prototype.slice.call(arguments),
      data = obj.splice(obj.length - 1, 1)[0],
      path = this._body,
      returnData;

  if (obj && obj.length > 0 && arguments.length > 1) {
    // go through arguments list to set body members
    obj.forEach(function(name, index, array) {
      if (index === array.length - 1 && typeof(data) === 'undefined') {
        delete path[name];
      } else {
        path[name] = (index === array.length - 1) ? data : path[name] || {};
        path = path[name];
      }
    });

    returnData = this;
  } else if (obj && arguments.length > 0) {
    if (typeof(data) === 'object') {
      // we want to set the complete body
      this._body = JSON.parse(JSON.stringify(data));

      returnData = this;
    } else {
      // we don't set anything, but we want a specific body property
      returnData = (typeof(this._body[data]) === 'object') ?
        JSON.parse(JSON.stringify(this._body[data])) :
        this._body[data];
    }
  } else {
    // we don't set anything, but we want the complete body
    returnData = JSON.parse(JSON.stringify(this._body));
  }

  return returnData;
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
  callback = callback || targetRevisionOrCallback;

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
 * deletes an attachment
 *
 * @param {string} name attachment name
 * @param {function(error, deleted)} callback function that will be called,
 *     after the attachment was deleted
 */
Document.prototype.deleteAttachment = function(name, callback) {
  this._connection.request({
    'method': 'DELETE',
    'path': this._database.name() + '/' +
            this._id + '/' + name +
            '?rev=' + this._revision,
    'callback': (function(error, confirmed) {
      if (error) {
        confirmed = false;
      } else {
        this._revision = confirmed.rev;
        confirmed = true;
      }

      callback(error, confirmed);
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
 * load an attachment
 *
 * @param {string} name attachment name
 * @param {function(error, attachment)} callback function that will be called,
 *     after the attachment was loaded
 */
Document.prototype.getAttachment = function(name, callback) {
  this._connection.request({
    'method': 'GET',
    'path': this._database.name() + '/' +
            this._id + '/' + name +
            '?rev=' + this._revision,
    'callback': callback
  });
};


/**
 * get the id of the document
 *
 * @return {string} id of document
 */
Document.prototype.id = function() {
  return this._id;
};


/**
 * info about the document
 *
 * @param {function(error, info)} callback function that will called, after
 *     retrieving information, or if there was an error
 */
Document.prototype.info = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_info', 'reason': 'no document id was set'},
      null
    ));
  } else {
    this._connection.request({
      'method': 'HEAD',
      'path': this._database.name() + '/' + this._id,
      'callback': (function(error, response, headers) {
        var info = null;

        if (error === null) {
          this._revision = headers.etag.substr(1, headers.etag.length - 2);

          info = {
            'revision': this._revision,
            'size': headers['content-length']
          };
        }

        callback(error, info);
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
      {'error': 'no_load', 'reason': this._error.noId},
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
 * get the revision of the document
 *
 * @return {string} revision of the document
 */
Document.prototype.revision = function() {
  return this._revision;
};


/**
 * saves content at the document
 * try to creates a new document, if there's no revision
 * if you want to save an existing document, you have to .load() it before, so
 * the revision id will be saved here
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after saving the new content or if there was an error
 */
Document.prototype.save = function(callback) {
  var body = JSON.parse(JSON.stringify(this._body));

  if (this._revision !== null) {
    body._rev = this._revision;
  }

  this._connection.request({
    'method': (this._id === null) ? 'POST' : 'PUT',
    'path': this._database.name() + ((this._id === null) ? '' : '/' + this._id),
    'body': body,
    'callback': (function (error, response) {
      if (error === null) {
        this._id = response.id;
        this._revision = response.rev;
      }

      callback(error, this);
    }).bind(this)
  });
};


/**
 * saves an attachment
 *
 * @param {string} file path to the file
 * @param {string} contentType content type header of the file (e.g. text/plain)
 * @param {string|function(error, response)} name of the attachment or function
 *     that will be called, after saving the attachment; if you don't set the
 *     name, it will be automatically the name of the file
 * @param {?function(error, response)} callback function that will be called,
 *     after saving the attachment
 */
Document.prototype.saveAttachment = function(
  file,
  contentType,
  nameOrCallback,
  callback
) {
  var filename = (typeof(nameOrCallback) === 'string') ?
        nameOrCallback :
        file.split('/').pop();
  callback = callback || nameOrCallback;

  fs.readFile(file, 'utf8', (function(error, data) {
    if (error) {
      process.nextTick(callback({
        'error': 'no_file',
        'reason': this._error.noFile + ': ' + file
      }, null));
    } else {
      this._connection.request({
        'method': 'PUT',
        'path': this._database.name() + '/' +
                this._id + '/' + filename +
                '?rev=' + this._revision,
        'headers': {
          'Content-Length': data.length,
          'Content-Type': contentType
        },
        'body': data,
        'callback': (function(error, confirmed) {
          if (error) {
            confirmed = false;
          } else {
            this._revision = confirmed.rev;
            confirmed = true;
          }

          callback(error, confirmed);
        }).bind(this)
      });
    }
  }).bind(this));
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