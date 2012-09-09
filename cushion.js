// jshint settings
/*global require: false, exports: false */

var http = require('http'),
    defaultOptions = require('./config.js'),
    Database = require('./database.js').Database,
    UserApi = require('./user.js').User;

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 * @param {object} additional additional options:
 *     {boolean} [secure=false] set this to true, if you want https-connections
 *     {string} [path=''] set an additional path, if you want to connect through
 *         this (e.g. a proxy, because of connecting from browser)
 */
var cushion = function(host, port, username, password, additional) {
  additional = additional || {};

  this._methodMatch = /^GET|PUT|POST|DELETE|HEAD|COPY$/i;
  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
    'secure': additional.secure || defaultOptions.secure,
    'path': (additional.path) ? additional.path + '/' : defaultOptions.path
  };

  if (this._options.secure === true) {
    http = require('https');
  }
};


/**
 * returns a list of active tasks
 *
 * @param {function(error, activeTasks)} callback function that will called,
 *     after getting the list of active tasks or if there was an error
 */
cushion.prototype.activeTasks = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_active_tasks',
    'callback': callback
  });
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
        response = (value !== undefined) ? true : response;
      }

      callback(error, response);
    }
  };

  // do we set a new value?
  if (typeof(value) === 'string' || typeof(value) === 'number') {
    options.body = '"' + value + '"';
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
  // first we have to create a new option at the config
  this.config('admins', name, password, (function(error, created) {
    // after that we have to create a user document
    var database,
        document;

    if (created === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.body('name', name);
      document.body('type', 'user');
      document.body('roles', []);
      document.save(function(error, document) {
        if (error) {
          callback(error, null);
        } else {
          callback(error, true);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * gives a connection to a specific database
 *
 * @param {string} name name of the database
 * @return {Object} the database object
 */
cushion.prototype.database = function(name) {
  return new Database(name, this);
};


/**
 * deletes an admin
 *
 * @param {string} name username of the admin
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the admin account, or if there was an error
 */
cushion.prototype.deleteAdmin = function(name, callback) {
  // first we have to delete the admin option
  this.config('admins', name, null, (function(error, deleted) {
    // after that we have to delete the user document
    var database,
        document;

    if (deleted === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.load(function(error, document) {
        if (document) {
          document.destroy(function(error, document) {
            if (document) {
              callback(null, true);
            } else {
              callback(error, null);
            }
          });
        } else {
          callback(error, null);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * retrieving a list of databases
 *
 *
 * @param {boolean|function(error, databases)} noCouchRelatedOrCallback filters
 *     all couch related databases, so the list has only databases which a user
 *     has set up or function that will be called after retrieving a list of
 *     databases, or if there was an error
 * @param {?function()} callback function that will be called after retrieving a
 *     list of databases, or if there was an error
 */

cushion.prototype.listDatabases = function(noCouchRelatedOrCallback, callback) {
  var noCouchRelated = (callback) ? noCouchRelatedOrCallback : null;
  callback = callback || noCouchRelatedOrCallback;

  this.request({
    'method': 'GET',
    'path': '_all_dbs',
    'callback': (function (error, response) {
      if (error === null && response !== null) {
        // filter couch related databases, if user want's so
        if (noCouchRelated === true) {
          response = response.filter(function(dbName, index, list) {
            return (dbName[0] !== '_');
          });
        }

        // create database objects
        response = response.map(function(dbName) {
          return this.database(dbName);
        }, this);
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * returns the tail of the server's log file
 *
 * @param {number|function(error, log)} bytesOrCallback number of bytes how many
 *     do you want from the tail or function that will be called, after getting
 *     the log or if there was an error
 * @param {?function(error, log)} callback function that will be called, after
 *     getting the log or if there was an error
 */
cushion.prototype.log = function(bytesOrCallback, callback) {
  var bytes = (arguments.length > 1) ? bytesOrCallback : null;
  callback = callback || bytesOrCallback;

  this.request({
    'method': 'GET',
    'path': '_log' + ((bytes) ? '?bytes=' + bytes : ''),
    'callback': callback
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

      if (response.statusCode === 404 && content.length === 0) {
        content = {
          'error': 'not_found',
          'reason': 'missing'
        };
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
        'path': '/' + this._options.path + (properties.path || ''),
        'auth': this._options.username + ':' + this._options.password,
        'headers': properties.headers || {}
      },
      request;

  // make sure, that we get application/json response from couchdb
  options.headers.Accept = options.headers.Accept || '*/*,application/json';
  options.headers['Content-Type'] = options.headers['Content-Type'] ||
    'application/json';

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
 * restarts the couchdb
 *
 * @param {function(error, restart)} callback function that will be called,
 *     after initializing the restart or if there was an error
 */
cushion.prototype.restart = function(callback) {
  this.request({
    'method': 'POST',
    'path': '_restart',
    'callback': function(error, restart) {
      if (error && error.code === 'ECONNRESET') {
        error = null;
        restart = true;
      }

      callback(error, restart);
    }
  });
};


/**
 * returns server statistics
 *
 * @param {function(error, stats)} callback function that will be called, after
 *     getting the statistics of if there was an error
 */
cushion.prototype.stats = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_stats',
    'callback': callback
  });
};


/**
 * get the user object
 *
 * @return {cushion.User} the user object
 */
cushion.prototype.user = function() {
  return new UserApi(this);
};


/**
 * returns a list of generated uuids
 *
 * @param {number|function(error, uuidList)} countOrCallback number of uuids to
 *     generate or function that will be called, after getting the list of uuids
 *     or if there was an error
 * @param {?function(error, uuidList)} callback function that will be called,
 *     after getting the list of uuids or if there was an error
 */
cushion.prototype.uuids = function(countOrCallback, callback) {
  var count = (arguments.length > 1) ? countOrCallback : null;
  callback = callback || countOrCallback;

  this.request({
    'method': 'GET',
    'path': '_uuids' + ((count) ? '?count=' + count : ''),
    'callback': function(error, uuidList) {
      if (uuidList) {
        uuidList = uuidList.uuids;
      }

      callback(error, uuidList);
    }
  });
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
