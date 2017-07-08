module.exports = function() {

  var util = require('util')
    , misc = require('../../app/helpers/misc')()
    , rest = require('restler')
    ;

  var PROTOCOL  = 'http://';
  var SBADDRESS = config.sb.host + ':' + config.sb.port;
  var PROXYURI  = '/WearableDemoMulti/Proxy/';
  var OPURI = {
              REGISTER            : { URI : PROXYURI + 'register' },
              DEREGISTER          : { URI : PROXYURI + 'deregister' },
              MEDRESULT           : { URI : PROXYURI + 'medresult' },
              STEPEVENT           : { URI : PROXYURI + 'stepevent' },
              PULSEEVENT          : { URI : PROXYURI + 'pulseevent' },
              PULSEWARN           : { URI : PROXYURI + 'pulsewarn' },
              PULSESTOP           : { URI : PROXYURI + 'pulsestop' },
              BLOODPRESSURERESULT : { URI : PROXYURI + 'bloodpressureresult' },
              WEIGHTRESULT        : { URI : PROXYURI + 'weightresult' },
              BATTERYEVENT        : { URI : PROXYURI + 'batteryevent' },
              SOSEVENT            : { URI : PROXYURI + 'sosevent' },
              FALLEVENT           : { URI : PROXYURI + 'fallevent' },
              SEARCHIMEI          : { URI : PROXYURI + 'searchimei' },
              // Pulse Thresholds Management ops
              GETPULSETHRESHOLDS : { URI : '/WearableDemoMulti/GetPulseThresholdsService/getpulsethresholds' },       // GET
              SETPULSETHRESHOLDS : { URI : '/WearableDemoMulti/UpdatePulseThresholdsService/updatepulsethresholds' }  // POST
            };

  var module = {};

  function sendPostRequest(op, payload, handleResult) {
    var URL = PROTOCOL + SBADDRESS + op.URI;
    misc.debug("[REST OPS]" + " " + "Sending POST to " + URL + ", payload: " + payload);
    rest.postJson(URL,
      JSON.parse(payload),
      {timeout: RESTCLIENTTIMEOUT})
      .on('success', function(data, response) {
        misc.debug("[REST OPS]" + " " + "sendPostRequest onSuccess: " + JSON.stringify(data));
        handleResult(SUCCESS, JSON.stringify(data));
      })
      .on('fail', function(data, response) {
        var responseText = response.statusCode + ": " + response.statusMessage;
        misc.debug("[REST OPS]" + " " + "sendPostRequest onFail: " + responseText);
        handleResult(ERROR, responseText);
      })
      .on('error', function(err, response) {
        misc.debug("[REST OPS]" + " " + "sendPostRequest onError: " + err);
        handleResult(ERROR, util.inspect(err, true, null));
      })
      .on('timeout', function(ms) {
        misc.debug("[REST OPS]" + " " + "sendPostRequest onTimeout");
        var response = {};
        response.result = TIMEOUT;
        response.detail = "TIMEOUT after " + ms + " milliseconds";
        misc.error(response.detail);
        handleResult(TIMEOUT, JSON.stringify(response));
      })
    ;
  };

  function sendGetRequest(op, queryObject, handleResult) {
    var URL = PROTOCOL + SBADDRESS + op.URI;
    misc.debug("[REST OPS]" + " " + "Sending GET to " + URL);
    var options = {
      method: "GET",
      timeout: RESTCLIENTTIMEOUT,
    };

    if ( queryObject !== undefined) {
      options.query = queryObject;
    }

    rest.get(URL, options)
      .on('success', function(data, response) {
        misc.debug("[REST OPS]" + " " + "sendGetRequest onSuccess: " + JSON.stringify(data));
        handleResult(SUCCESS, JSON.stringify(data));
      })
      .on('fail', function(data, response) {
        var responseText = response.statusCode + ": " + response.statusMessage;
        misc.debug("[REST OPS]" + " " + "sendPostRequest onFail: " + responseText);
        handleResult(ERROR, responseText);
      })
      .on('error', function(err, response) {
        misc.debug("[REST OPS]" + " " + "sendGetRequest onError: " + err);
        handleResult(ERROR, util.inspect(err, true, null));
      })
      .on('timeout', function(ms) {
        misc.debug("[REST OPS]" + " " + "sendGetRequest onTimeout");
        var response = {};
        response.result = TIMEOUT;
        response.detail = "TIMEOUT after " + ms + " milliseconds";
        misc.error("[REST OPS]" + " " + response.detail);
        handleResult(TIMEOUT, JSON.stringify(response));
      })
    ;
  };

  module.ping = function (payload, handleResult) {
    handleResult( 0, payload);
  }

  module.register = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking register with payload " + payload);
    sendPostRequest(OPURI.REGISTER, payload, handleResult);
  };

  module.deregister = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking deregister with payload " + payload);
    sendPostRequest(OPURI.DEREGISTER, payload, handleResult);
  };

  module.medUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking medUpdate with payload " + payload);
    sendPostRequest(OPURI.MEDRESULT, payload, handleResult);
  };

  module.stepUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking stepUpdate with payload " + payload);
    sendPostRequest(OPURI.STEPEVENT, payload, handleResult);
  };

  module.pulseUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking pulseUpdate with payload " + payload);
    sendPostRequest(OPURI.PULSEEVENT, payload, handleResult);
  };

  module.pulseWarn = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking pulseWarn with payload " + payload);
    sendPostRequest(OPURI.PULSEWARN, payload, handleResult);
  };

  module.pulseStop = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking pulseStop with payload " + payload);
    sendPostRequest(OPURI.PULSESTOP, payload, handleResult);
  };

  module.bloodPressureUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking bloodPressureUpdate with payload " + payload);
    sendPostRequest(OPURI.BLOODPRESSURERESULT, payload, handleResult);
  };

  module.weightUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking weightUpdate with payload " + payload);
    sendPostRequest(OPURI.WEIGHTRESULT, payload, handleResult);
  };

  module.batteryUpdate = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking batteryUpdate with payload " + payload);
    sendPostRequest(OPURI.BATTERYEVENT, payload, handleResult);
  };

  module.handleSOScall = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking SOS event with payload " + payload);
    sendPostRequest(OPURI.SOSEVENT, payload, handleResult);
  };

  module.handleFall = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking Fall event with payload " + payload);
    sendPostRequest(OPURI.FALLEVENT, payload, handleResult);
  };

  module.searchIMEI = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking searchIMEI with payload " + JSON.stringify(payload));
    sendGetRequest(OPURI.SEARCHIMEI, payload, handleResult);
  };
  module.getPulseThresholds = function (handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking getPulseThresholds with payload {}");
    sendGetRequest(OPURI.GETPULSETHRESHOLDS, undefined, handleResult);
  };

  module.setPulseThresholds = function (payload, handleResult) {
    misc.debug("[REST OPS]" + " " + "Invoking setPulseThresholds with payload " + payload);
    sendPostRequest(OPURI.SETPULSETHRESHOLDS, payload, handleResult);
  };

  return module;

};
