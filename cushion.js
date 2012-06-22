var http = require('http');

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 * @param {object} additional additional options:
 *     {boolean} [secure=false] set this to true, if you want https-connections
 */
var cushion = function(host, port, username, password, additional) {
  var defaultOptions = require('./config.js');
  additional = additional || {};

  this._methodMatch = /^GET|PUT|POST|DELETE|HEAD|COPY$/i,
  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
    'secure': additional.secure || defaultOptions.secure
  };

  if (this._options.secure === true) {
    http = require('https');
  }
};


/**
 * gives a connection to a specific database
 *
 * @param {string} name name of the database
 * @return {Object} the database object
 */
cushion.prototype.database = function(name) {
  return new (require('./database.js').Database)(name, this);
};


/**
 * retrieving a list of databases
 *
 * @param {function(error, response)} callback function that will be called
 *     after retrieving a list of databases, or at an error
 * @param {boolean} noCouchRelated filters all couch related db's, so the list
 *     has only database which a user has set up
 */
cushion.prototype.listDatabases = function(callback, noCouchRelated) {
  this.request({
    'method': 'GET',
    'path': '_all_dbs',
    'callback': (function (error, response) {
      var i;

      if (error === null && response !== null && noCouchRelated === true) {
        for (i = 0; response[i]; ++i) {
          if (response[i].substr(0, 1) === '_') {
            response.splice(i, 1);
            --i;
          }
        }
      }

      // create database objects
      if (error === null && response !== null) {
        for (i = 0; response[i]; ++i) {
          // filter couch related databases, if user want's so
          if (noCouchRelated === true && response[i][0] === '_') {
            response.splice(i, 1);
            --i;
          }

          response[i] = this.database(response[i]);
        }
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * wrapper function for any request to the couchdb
 *
 * @param {Function} callback function that will be called after all data events
 * @param {http.ClientResponse} response the http response object
 */
cushion.prototype._request = function(callback, response) {
  var content = '';

  response.setEncoding('utf8');

  response.on('data', function(chunk) {
    content += chunk;
  });

  response.on('end', (function() {
    try {
      if (
        response.headers['content-type'] === 'application/json' &&
        content.length > 0
      ) {
        content = JSON.parse(content);
      }

      callback(
        (content.error) ? content : null,
        (!content.error) ? content : null,
        response.headers || null
      );
    } catch(error) {
      callback(error, null, null);
    }
  }).bind(this));
};


/**
 * sends a request to the couch
 *
 * @param {object} properties options for the request
 *      method: {string} http method, can be GET, PUT, POST, DELETE, HEAD, COPY
 *      path: {string} uri path after domain
 *      headers: {Object} key/value-pairs of additional http headers
 *      body: {Object|Array} additional body
 *      callback: {function(error, response)} function that will be called,
 *                after getting the response or if there was an error
 */
cushion.prototype.request = function(properties) {
  var options = {
        'host': this._options.host,
        'port': this._options.port,
        'method': (
                    typeof(properties.method) === 'string' &&
                    properties.method.match(this._methodMatch) !== null
                  ) ?
                  properties.method :
                  'GET',
        'path': '/' + (properties.path || ''),
        'auth': this._options.username + ':' + this._options.password,
        'headers': properties.headers || {},
      },
      request;

  // make sure, that we get application/json response from couchdb
  options.headers.Accept = options.headers.Accept || '*/*,application/json';
  options.headers['Content-Type'] = 'application/json';

  // set up request object
  request = http.request(
    options,
    this._request.bind(this, properties.callback)
  );

  // define callback, if there is an error
  request.on('error', (function(error) {
    properties.callback(error, null, null);
  }).bind(this));

  // adding optional body to the request
  if (properties.body) {
    if (typeof(properties.body) === 'object') {
      request.write(JSON.stringify(properties.body));
    } else {
      request.write(properties.body);
    }
  }

  // starting request
  request.end();
};


/**
 * gets the version of the couchdb
 *
 * @param {Function(version)} callback function that will be called after
 */
cushion.prototype.version = function(callback) {
  this.request({
    'method': 'GET',
    'path': '',
    'callback': function(error, response) {
      if (response !== null) {
        response = response.version;
      }

      callback(error, response);
    }
  });
};


exports.Connection = cushion;
