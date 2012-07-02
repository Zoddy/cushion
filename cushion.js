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
 * set or get configuration params
 * if you set:
 *   one param: you will get the complete configuration
 *   two params: you will get all options of the specific section
 *   three params: you will get the content of the specific option
 *   four params: you set a specific option to the new value, or you delete the
 *                given option, if you set value to null
 *
 * @param {string|function(error, configuration)} sectionOrCallback a section of
 *     different config params or function that will be called, after getting
 *     the whole configuration or if there was an error
 * @param {?string|function(error, options)} optionOrCallback an specific option
 *     or a function, that will be called, after getting the options of the
 *     section of if there was an error
 * @param {?string|function(error, value)} valueOrCallback the new value for the
 *     option or function that will be called, after getting the content of the
 *     option; if you set the value to null, option will be deleted
 * @param {?function(error, saved)} callback function that will be called after
 *     saving the new value, or if there was an error
 */
cushion.prototype.config = function(
  sectionOrCallback,
  optionOrCallback,
  valueOrCallback,
  callback
) {
  var section = (typeof(sectionOrCallback) === 'string') ?
        sectionOrCallback :
        null,
      option = (typeof(optionOrCallback) === 'string') ?
        optionOrCallback :
        null,
      value = (
        typeof(valueOrCallback) === 'string' ||
        typeof(valueOrCallback) === 'number' ||
        valueOrCallback === null
      ) ? valueOrCallback : undefined,
      options;
  callback = callback ||
    valueOrCallback ||
    optionOrCallback ||
    sectionOrCallback;

  options = {
    'method': (value !== undefined) ?
      ((value === null) ? 'DELETE' : 'PUT') :
      'GET',
    'path': '_config' +
      ((section) ? '/' + section : '') +
      ((option) ? '/' + option : ''),
    'callback': function(error, response) {
      if (error) {
        response = null;
      } else {
        response = true;
      }

      callback(error, response);
    }
  };

  // do we set a new value?
  if (typeof(value) === 'string' || typeof(value) === 'number') {
    options.body = '"' + value + '"'
  }

  this.request(options);
};


/**
 * creates an admin
 *
 * @param {string} name name of the admin account
 * @param {string} password password of the admin account
 * @param {function(error, created)} callback function that will be called after
 *     creating the admin account, or if there was an error
 */
cushion.prototype.createAdmin = function(name, password, callback) {
  this.config('admins', name, password, function(error, saved) {
    if (!error && saved === null) {
      callback(null, true);
    } else {
      callback(error, null);
    }
  });
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
