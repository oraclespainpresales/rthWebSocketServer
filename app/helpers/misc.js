module.exports = function() {

  var propParser = require('properties-parser')
    , argv = require('minimist')(process.argv.slice(2))
    , moment = require('moment')
    ;

  var module = {};

  module.log = function(text) {
    console.log(getNow() + " [INF] - " + text);
  };

  module.error = function(text) {
    console.log(getNow() + " [ERR] - " + text);
  };

  module.debug = function(text) {
    if ( DEBUG) {
      if ( !( DONTDEBUGPING && text.contains('PING')))
        console.log(getNow() + " [DBG] - " + text);
    }
  };

  function getNow() {
    return '[' + moment().format(DATETIMEFORMAT) + ']';
  }

  module.printBanner = function (v) {
    var banner = "Realtime Healthcare - WebSocket Server (Multi) - node.js version - " + v;
    var lines = new Array(banner.length + 1).join( '=' );
    console.log();
    console.log(lines);
    console.log(banner);
    console.log(lines);
    console.log();
  };

  module.usage = function () {
    this.debug("Usage: ws.js [--debug] [--properties <file>]");
  };

  module.parseInputParameters = function(onErr){
    delete argv['_']; // get rid of the default "_" element
    if ( argv.debug) {
      DEBUG = true;
      delete argv['debug'];
    }
    if ( argv.properties) {
      PROPERTIESFILE = argv.properties;
      delete argv['properties'];
    }
    if (Object.getOwnPropertyNames(argv).length > 0)
      onErr('Invalid input parameters');
  };

  module.readProperties = function (file, onErr) {
    try {
      var p = propParser.createEditor('./' + file);

      // Validate Propertys file
      if ( p.get(pDEBUG) === undefined) {
        onErr("Property " + pDEBUG + " not defined");
      } else {
        DEBUG = (p.get(pDEBUG) === "true");
      }
      if ( p.get(pWSPORT) === undefined) {
        onErr("Property " + pWSPORT + " not defined");
      } else {
        config.ws.port = p.get(pWSPORT);
      }
      if ( p.get(pWSSSL) === undefined) {
        onErr("Property " + pWSSSL + " not defined");
      } else {
        config.ws.ssl = p.get(pWSSSL);
      }
      if ( p.get(pRESTPORT) === undefined) {
        onErr("Property " + pRESTPORT + " not defined");
      } else {
        config.rest.port = p.get(pRESTPORT);
      }
      if ( p.get(pRESTSSL) === undefined) {
        onErr("Property " + pRESTSSL + " not defined");
      } else {
        config.rest.ssl = (p.get(pRESTSSL) === "true");
      }
      if ( p.get(pSBHOST) === undefined) {
        onErr("Property " + pSBHOST + " not defined");
      } else {
        config.sb.host = p.get(pSBHOST);
      }
      if ( p.get(pSBPORT) === undefined) {
        onErr("Property " + pSBPORT + " not defined");
      } else {
        config.sb.port = p.get(pSBPORT);
      }
    } catch (err) {
      onErr(err.stack);
    }
  };
  return module;

};
