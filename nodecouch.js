var http = require('http');

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 * @param {string} [errorHandling=this._options.fullErrorHandling]
 *     true = handles couch errors like connection errors
 *     false = handles couch error in the response
 */
var nodecouch = function(host, port, username, password, fullErrorHandling) {
  var defaultOptions = require('./config.js');

  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
    'fullErrorHandling': fullErrorHandling || defaultOptions.fullErrorHandling
  };
};


/**
 * creates a database
 *
 * @param {string} name name for the new database
 * @param {function(error, response)} callback function that will be called
 *     after response or error
 */
nodecouch.prototype.createDatabase = function(name, callback) {
  this.request('PUT', name, callback);
};


/**
 * gives a connection to a specific database
 *
 * @param {string} name name of the database
 * @return {Object} the database object
 */
nodecouch.prototype.database = function(name) {
  return new (require('./database.js').database)(name, this);
};


/**
 * deletes a database
 *
 * @param {string} name name of the database
 * @param {function(error, response)} callback function that will be called
 *     after response or error
 */
nodecouch.prototype.deleteDatabase = function(name, callback) {
  this.request('DELETE', name, callback);
};

/**
 * gets the version of the couchdb
 *
 * @param {Function(version)} callback function that will be called after
 */
nodecouch.prototype.getVersion = function(callback) {
  this.request('GET', '', function(error, response) {
    if (response !== null) {
      response = response.version;
    }

    callback(error, response);
  });
};


/**
 * retrieving a list of databases
 *
 * @param {function(error, response)} callback function that will be called
 *     after retrieving a list of databases, or at an error
 * @param {boolean} noCouchRelated filters all couch related db's, so the list
 *     has only database which a user has set up
 */
nodecouch.prototype.listDatabases = function(callback, noCouchRelated) {
  this.request('GET', '_all_dbs', function (error, response) {
    var i;

    if (error === null && response !== null && noCouchRelated === true) {
      for (i = 0; response[i]; ++i) {
        if (response[i].substr(0, 1) === '_') {
          response.splice(i, 1);
          --i;
        }
      }
    }

    callback(error, response);
  });
};


/**
 * request response handler
 *
 * @param {Function} callback function that will be called after all data events
 * @param {Object} error error data
 * @param {Object} response request response data
 */
nodecouch.prototype._responseHandler = function(callback, error, response) {
  if (
    this._options.fullErrorHandling === true &&
    response &&
    response.error
  ) {
    error = response;
    response = null;
  }

  callback(error, response);
}


/**
 * wrapper function for any request to the couchdb
 *
 * @param {Function} callback function that will be called after all data events
 * @param {http.ClientResponse} response the http response object
 */
nodecouch.prototype._request = function(callback, response) {
  var content = '';

  response.setEncoding('utf8');

  response.on('data', function(chunk) {
    content += chunk;
  });

  response.on('end', (function() {
    this._responseHandler(callback, null, JSON.parse(content));
  }).bind(this));
};


/**
 * sends a request to the couch
 *
 * @param {string} method http method, can only be GET, PUT, POST or DELETE
 * @param {string} path every path for the couchdb
 * @param {Function(error, response)} callback function that will be called
 *     after successfully retrieving a response from couchdb
 *     the error argument will only be filled, if there is an error at the
 *     connection, it doesn't show errors that relating to the couchdb, this
 *     information will be find in the response argument
 * @param {?Object|null} body additional http body
 * @param {?Object} headers additional headers as key-value-pairs
 */
nodecouch.prototype.request = function(method, path, callback, body, headers) {
  headers = headers || {};
  headers['Content-Type'] = 'application/json';

  console.log(headers);

  var options = {
        'host': this._options.host,
        'port': this._options.port,
        'method': method,
        'path': '/' + path,
        'auth': this._options.username + ':' + this._options.password,
        'headers': headers
      },
      request = http.request(options, this._request.bind(this, callback)),
      context = this;

  request.on('error', function(error) {
    context._responseHandler(callback, error, null);
  });

  if (body) {
    request.write(JSON.stringify(body));
  }

  request.end();
};


exports.Connection = nodecouch;
