var http = require('http');

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 */
var nodecouch = function(host, port, username, password) {
  var defaultOptions = require('./config.js');

  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
  };
};


/**
 * gets the version of the couchdb
 *
 * @param {Function(version)} callback function that will be called after
 */
nodecouch.prototype.getVersion = function(callback) {
  this.request('GET', '', callback);
};


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

  response.on('end', function() {
    callback(null, JSON.parse(content).version);
  });
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
 */
nodecouch.prototype.request = function(method, path, callback) {
  var options = {
        'host': this._options.host,
        'port': this._options.port,
        'method': method,
        'path': path,
        'auth': this._options.username + ':' + this._options.password
      },
      request = http.request(options, this._request.bind(this, callback));

  request.on('error', function(error) {
    callback(error, null);
  });

  request.end();
};


exports.Connection = nodecouch;
