module.exports = function() {

  var util = require('util')
    , sprintf = require("sprintf-js").sprintf
    , url = require('url')
    , misc = require('../../app/helpers/misc')()
    , msgHandler = require('./wsMessageHandler')()
    , ops  = require('../../app/helpers/operations')()
    , moment = require('moment')
    ;

  var incomingUrl;

  clientVerification = function (info) {
    incomingUrl = info.req.url;
    return true;
  };

  eServerConnection = function(ws) {

    var sessionId = "";
    var session = {};
    var sessionData = {};
    var deviceAuditObj  = undefined;
    var sessionAuditObj = undefined;

    // Local event handlers
    var onClose = function() {
      if ( sessionData.status === "DUP" || sessionData.status === "ERR") {
        // We are closing a duplicated session.
        // Do nothing here
        misc.debug("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "DUP/ERR session closed");
        return;
      }
      misc.log("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Closed session for ID ([" + sessionData.target + "," + sessionData.IMEI + "])");
      if ( sessions.find({id:sessionData}) === undefined) {
        misc.log("onClose: current session ([" + sessionData.target + "," + sessionData.IMEI + "]) not found!");
      } else {
        sessions.remove({id:sessionData});
        misc.debug("onClose: removing session ([" + sessionData.target + "," + sessionData.IMEI + "]) from pool");
        sessionAuditObj.endTime = moment().format(DATETIMEFORMAT);
        var ms = moment(sessionAuditObj.endTime, DATETIMEFORMAT).diff(moment(sessionAuditObj.startupTime,DATETIMEFORMAT));
        sessionAuditObj.uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");
      }
    }

    var onError = function(error) {
      misc.debug("onError: " + util.inspect(error, true, null));
    };

    var onOpen = function() {
      // This one never seems to get called :-?
      misc.debug("onOpen for ID ([" + sessionData.target + "," + sessionData.IMEI + "])");
    };

    var onMessage = function(data, flags) {
      misc.debug("[" + sessionData.target + "," + sessionData.IMEI + "] onMessage - Data: " + data);
      msgHandler.handleMessage( sessionData, sessionAuditObj, ws, data);
    };

    // Register Events
    ws.on('close', onClose);
    ws.on('error', onError);
    ws.on('open', onOpen);
    // We don't register the "onMessage" callback until we validate the session

    // Main code
    var q = url.parse(incomingUrl, true, true);
    sessionId = q.query.id;
    if ( !sessionId) {
      misc.error("Invalid request. Missing 'id' input parameter in the request URL: " + incomingUrl);
      // Set AUDIT
      AUDIT.main.erroredSessions++;
      // Send ACK back
      var response = ERR + SEP + VERSION + SEP + "Missing session id";
      sendAck(sessionData, ws, response, function() {
        sessionData.status = "ERR"; // We mark this session as "ERR" so that we don't log its onClose() method
        ws.terminate();
      });
      return;
    }

    var sData = sessionId.split(SESSIONSEP);
    sessionData = {
      target : sData[0],
      IMEI   : sData[1],
      status : "OK" // OK so far. Might be "DUP" or "ERR" afterwards
    };

    if ( sessionData.target === undefined || sessionData.IMEI === undefined) {
      misc.error("Invalid request. Invalid session id in the request URL: " + incomingUrl);
      // Set AUDIT
      AUDIT.main.erroredSessions++;
      // Send ACK back
      var response = ERR + SEP + VERSION + SEP + "Invalid session id";
      sendAck(sessionData, ws, response, function() {
        sessionData.status = "ERR"; // We mark this session as "ERR" so that we don't log its onClose() method
        ws.terminate();
      });
      return;
    }

    // Validate id
    // Session will be <target>,<IMEI>
    // First, let's check if <target> is valid
    var found = false;
    for ( i in VALIDSESSIONS) {
      if ( sessionData.target === VALIDSESSIONS[i]) {
        found = true;
        break;
      }
    }

//    auditObj.totalSessions++;

    if ( !found) {
      misc.error("Invalid request. Connection request with invalid 'id target': " + sessionData.target);
      // Send ACK back
      var response = ERR + SEP + VERSION + SEP + "Invalid session id target";
      sendAck(sessionData, ws, response, function() {
        sessionData.status = "ERR"; // We mark this session as "ERR" so that we don't log its onClose() method
        ws.terminate();
      });
      return;
    }

    // Now, check whether the <IMEI> is valid. We'll do so by invoking a SB service
    ops.searchIMEI({IMEI: sessionData.IMEI}, function (code, result) {
      var device = undefined;
      var d = "";
      if ( code === ERROR)
        d = "ERROR";
      if ( code === TIMEOUT)
        d = "TIMEOUT";
      if ( code === SUCCESS) {
        device = JSON.parse(result);
        d = ( device.name !== undefined && device.name !== null) ? device.name : "UNKNOWN";
      }
      deviceFound(d, device, result);
    });

    var deviceFound = function (code, device, result) {
      if ( code === "UNKNOWN" || code === "ERROR" || code === "TIMEOUT") {
        misc.log("Opened session for UNKNOWN DEVICE ID ([" + sessionData.target + "," + sessionData.IMEI + "])" );
        var msg = "";
        switch ( code) {
          case "UNKNOWN":
            msg = "Unknown IMEI: device not registered";
          break;
          case "ERROR":
            msg = "Unexpected error validating device: " + result;
          break;
          default:
            msg = "Unable to validate device: backend services not available";
          break;
        }
        var response = ERR + SEP + VERSION + SEP + msg;
        sendAck(sessionData, ws, response, function() {
          misc.error("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Request to open session [" + sessionData.target + "," + sessionData.IMEI + "], " + msg);
          sessionData.status = "ERR"; // We mark this session as "ERR" so that we don't log its onClose() method
          ws.terminate();
        });
        return;
      }

      // Valid Session. Check for existing session with same id
      deviceAuditObj = (sessionData.target === TARGETS.SamsungGearS) ? AUDIT.samsungSessions : AUDIT.dashboardSessions;

      var existingSession = sessions.find({id:sessionData});
      if ( existingSession !== undefined) {
        deviceAuditObj.dupSessions++;
        misc.log("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Opened DUPLICATED session for ID ([" + sessionData.target + "," + sessionData.IMEI + "])" );
        var response = ERR + SEP + VERSION + SEP + "Session already opened";
        sendAck(sessionData, ws, response, function() {
          misc.error("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Request to open session [" + sessionData.target + "," + sessionData.IMEI + "], but it is already opened! Terminating the session");
          sessionData.status = "DUP"; // We mark this session as "DUP" so that we don't remove existing one from "sessions" array
          ws.terminate();
        });
        return;
      }

      // Valid target with valid id & no DUP session. Set audit Data
      var c = COUNTER.findByObj( [{deviceType: sessionData.target},{deviceId: sessionData.IMEI}]);
      if ( c === undefined || c.length === 0) {
        c = {
            deviceType : sessionData.target,
            deviceId   : sessionData.IMEI,
            counter    : 0
        };
        COUNTER.push(c);
        c = COUNTER.findByObj( [{deviceType: sessionData.target},{deviceId: sessionData.IMEI}]);
      }
      c[0].counter++;

      var newSession = {
        deviceId    : sessionData.IMEI,
        deviceName  : device.name,
        sessionId   : "Session " + sprintf('%03d', c[0].counter),
        startupTime : moment().format(DATETIMEFORMAT),
        endTime     : "",
        uptime      : "",
        requests    : 0,
        successful  : 0,
        errored     : 0,
        timedout    : 0
      };

      deviceAuditObj.sessions.push(newSession);
      deviceAuditObj.totalSessions++;
      sessionAuditObj = newSession;

      // Save sessionData
      var session = {
        id: sessionData,
        misc: { device: device.name },
        auditObj: sessionAuditObj,
        session: ws
      };
      sessions.push(session);

      misc.log("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Opened session for ID ([" + sessionData.target + "," + sessionData.IMEI + "]), device name: '" + session.misc.device + "'" );

      // Valid session, register "OnMessage" callback
      ws.on('message', onMessage);

      // Send ACK back
      var response = ACK + SEP + VERSION;
      sendAck(sessionData, ws, response);

      sessionAuditObj.requests = sessionAuditObj.successful = sessionAuditObj.errored = sessionAuditObj.timedout = 0;
    };

  };

  eServerError = function(error) {
    misc.error("eServerError: " + util.inspect(error, true, null));
  };

  function sendAck(sessionData, ws, response, callback) {
    misc.debug("[" + sessionData.target + "," + sessionData.IMEI + "]" + " " + "Sending 'ack' back to client: " + response);
    ws.send(response, function (err) {
      if ( err) {
        // Error during send ing ACK message. Force session close
        deviceAuditObj.terminatedSessions++;
        misc.error("ERROR while trying to send ACK back!!!");
        misc.debug(util.inspect(err, true, null));
        misc.error("Forced closing session for ID ([" + sessionData.target + "," + sessionData.IMEI + "])");
        ws.terminate();  // Force shutdown
        // Let's clean up internal structures. We don't trust that the onClose() callback gets called
        var s = sessions.find({id:sessionData});
        if ( s === undefined) {
          misc.log("Warning: current session ([" + sessionData.target + "," + sessionData.IMEI + "]) not found!");
        } else {
          misc.debug("Removing session [" + sessionData.target + "," + sessionData.IMEI + "] from Session Array");
          sessions.remove({id:sessionData});
          deviceAuditObj.terminatedSessions++;
          sessionAuditObj.endTime = moment().format(DATETIMEFORMAT);
          var ms = moment(sessionAuditObj.endTime, DATETIMEFORMAT).diff(moment(sessionAuditObj.startupTime,DATETIMEFORMAT));
          sessionAuditObj.uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");
        }
      } else {
        if (typeof(callback) == 'function') {
          callback();
        }
      }
    });
  }

}
