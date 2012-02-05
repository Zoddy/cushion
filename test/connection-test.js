// change this to connect to your database
var config = require('./config.js'),
    assert = require('assert'),
    vows = require('vows'),
    nodecouch = require('../nodecouch.js'),
    couch = new nodecouch.Connection(
      config.host,
      config.port,
      config.username,
      config.password
    );

vows.describe('nodecouch connection').addBatch({
  'when getting version': {
    'topic': function() {
      couch.version(this.callback);
    },

    'we get a version string': function(error, response) {
      assert.isString(response);
    }
  },
  'when getting list of databases': {
    'topic': function() {
      couch.listDatabases(this.callback);
    },

    'we get an array of nodecouch database objects': function(error, response) {
      assert.isArray(response);
    }
  },
  'when creating database object': {
    'topic': function() {
      return couch.database(config.database);
    },

    'we get a database object with correct name': function(topic) {
      assert.strictEqual(topic.name(), config.database);
    }
  }
}).export(module);