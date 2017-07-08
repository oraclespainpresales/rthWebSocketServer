#!/usr/bin/env node

'use strict';

// Module imports
var globals = require('./app/helpers/globals')()
  , WebSocketServer = require('ws').Server
  , express = require('express')
  , http = require('http')
  , https = require('https')
  , bodyParser = require('body-parser')
  , util = require('util')
  , proto = require('./app/helpers/prototypes')()
  , misc = require('./app/helpers/misc')()
  , wssHandler = require('./app/servers/wss')()
  , restsHandler = require('./app/servers/rests')()
  , httpsHandler = require('./app/servers/https')()
  , moment = require('moment')
  ;

// Instantiate classes & servers
var appWS          = express()
  , appRest        = express()
  , appConsole     = express()
  , routerRest     = express.Router()
  , routerConsole  = express.Router()
  , wsServer       = http.createServer(appWS)
  , wssServer      = https.createServer(appWS)
  , restServer     = http.createServer(appRest)
  , consoleServer  = http.createServer(appConsole)
  ;

// ************************************************************************
// Main code STARTS HERE !!
// ************************************************************************

// Main handlers registration - BEGIN
// Main error handler
process.on('uncaughtException', function (err) {
  misc.error("Uncaught Exception: " + err);
  misc.debug("Uncaught Exception: " + err.stack);
  AUDIT.main.unhandledErrors++;
  // TODO: close any existing socket, etc
  // TODO: do I want to exit the process???
});
// Detect CTRL-C
process.on('SIGINT', function() {
  misc.log("Caught interrupt signal");
  misc.log("Exiting gracefully");
  // TODO: close any existing socket, etc
  process.exit(2);
});
// Main handlers registration - END

// Banner
misc.printBanner(VERSION);
misc.usage();

// REST engine initial setup
appRest.use(bodyParser.urlencoded({ extended: true }));
appRest.use(bodyParser.json());

// Parse input parameters, if any
misc.parseInputParameters(function (err) {
  misc.error("Error parsing input paremeters: " + err);
  misc.error("Usage: ws.js [--debug] [--properties <file>]");
  process.exit(1);
});

// Read & Parse Properties file
misc.readProperties(PROPERTIESFILE, function (err) {
  misc.error("Error opening Properties file '" + PROPERTIESFILE + "': " + err);
  misc.error("ABORTING!!");
  process.exit(1);
});

misc.log("DEBUG mode " + ((DEBUG)?"enabled":"disabled"));

// WebSocket server initialization
wsServer.listen(config.ws.port, function() {
  misc.log("WebSockets server running on ws://localhost:" + config.ws.port + config.ws.URI);
});
var wss = new WebSocketServer({
  server: wsServer,
  path: config.ws.URI,
  verifyClient: clientVerification
});

wss.on('connection', eServerConnection);
wss.on('error', eServerError);

// REST server initialization
routerRest.post('/', onRestRequest);
appRest.use(config.rest.URI, routerRest);
restServer.listen(config.rest.port, function() {
  misc.log("REST server running on http://localhost:" + config.rest.port + config.rest.URI);
});

// HTTP console server initialization
routerConsole.get(config.console.apps.log, onLogRequest);
routerConsole.get(config.console.apps.reset, onResetRequest);
appConsole.use(config.console.URI, routerConsole);
consoleServer.listen(config.console.port, function() {
  misc.log("REST statistics server running on http://localhost:" + config.console.port + config.console.URI + config.console.apps.log);
  misc.log("HTTP reset server running on http://localhost:" + config.console.port + config.console.URI + config.console.apps.reset);
});

AUDIT.main.startupTime = moment().format(DATETIMEFORMAT);
