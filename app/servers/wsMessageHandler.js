module.exports = function() {

  var util = require('util')
    , misc = require('../../app/helpers/misc')()
    , ops  = require('../../app/helpers/operations')()
    , rest = require('restler')
    , uuid = require('node-uuid')
    , moment = require('moment')
    ;

  var module = {};

  module.handleMessage = function (sessionData, auditObj, session, input) {

    misc.debug("[" + sessionData.target + "," + sessionData.IMEI + "] Handling incoming message: " + input);

    auditObj.requests++;

    var aData = input.split(SEP);
    var parsedIn = {
                      messageType    : aData[0],
                      target         : aData[1],
                      op             : aData[2],
                      corrId         : aData[3],
                      messagePayload : ( aData.length > 4) ? aData[4] : ''
                   };

    // CHECK OP
    switch ( parsedIn.messageType) {
      case REQ:
        switch  (parsedIn.target) {
          case TARGETS.ORACLE:
            switch ( parsedIn.op) {
              case OPS.PING:
                ops.ping(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.REGISTER:
                ops.register(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.DEREGISTER:
                ops.deregister(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.GETPULSETHRESHOLDS:
                ops.getPulseThresholds(sendResponse);
              break;
              case OPS.SETPULSETHRESHOLDS:
                ops.setPulseThresholds(parsedIn.messagePayload, sendResponse);
              break;
              default:
                var response = {
                  result: -4,
                  detail: "Invalid operation: '" + parsedIn.op + "'"
                };
                misc.error(response.detail + ". Message: " + input);
                auditObj.errored++;
                sendResponse(-4, JSON.stringify(response));
              break;
            }
          break;
          case TARGETS.SamsungGearS:
            switch ( parsedIn.op) {
              case OPS.PULSESTOP:
                // TODO
                misc.debug("PULSETOP to SamsungGearS received!!!");
              break;
              case OPS.PULSEWARN:
                // TODO
                misc.debug("PULSETOP to SamsungGearS PULSEWARN!!!");
              break;
              default:
                var response = {
                  result: -4,
                  detail: "Invalid operation: '" + parsedIn.op + "'"
                };
                misc.error(response.detail + ". Message: " + input);
                auditObj.errored++;
                sendResponse(-4, JSON.stringify(response));
              break;
            }
          break;
          default:
            // TODO: Invalid target
          break;
        }
      break;
      case REP:
        switch  (parsedIn.op) {
          case OPS.SYNCHRONIZE:
          case OPS.PING:
          case OPS.STEPSTART:
          case OPS.PULSESTART:
          case OPS.PULSESTOP:
          case OPS.WEIGHTREQUEST:
          case OPS.BLOODPRESSUREREQUEST:
          case OPS.INFOREQUEST:
          case OPS.MESSAGEEVENT:
          case OPS.REGISTEREVENT:
          case OPS.NOTIFICATIONEVENT:
          case OPS.MEDEVENT:
          case OPS.ALERTEVENT:
          case OPS.BLOODPRESSUREEVENT:
          case OPS.STEPEVENT:
          case OPS.PULSEEVENT:
          case OPS.PULSEAVGEVENT:
          case OPS.DISTANCEEVENT:
          case OPS.PULSEWARN:
          case OPS.FALLWARN:
          case OPS.BATTERYEVENT:
          case OPS.WEIGHTEVENT:
          case OPS.DEVICEINFOEVENT:

            var restCallback = callbacks.find({id: parsedIn.corrId});
            if ( restCallback === undefined) {
              misc.debug( "Response received but not found in callbacks object: " + parsedIn.corrId + ". Maybe an already timed out response?");
              auditObj.errored++;
              break;
            }

            // PULSESTOP can be received either from SB (due to a wrong threshold check) or from the WS server (due to timeout)
            // When coming from SB, we must send the REST response back
            // When coming from the WS server itself, we just need to cancel the timer. No response to send back.

            // Response received on time. Clear caller's timeout timer
            clearTimeout( restCallback.timeout);

            if ( restCallback.restSession) {
              // If 'resetSession' object exists, then it means this was a call initiated by a REST call. Thus, send the REST response back
              misc.debug("[REST] Sending response: " + parsedIn.messagePayload);
              restCallback.restSession.send(parsedIn.messagePayload);
            }

            // Handle special PULSESTART event
            if ( parsedIn.op === OPS.PULSESTART) {

              var format = "YYYY-MM-DDTHH:mm:ss";
              var targetDate = moment(restCallback.pulsestartTarget, format).format(format);
              var now = moment().format(format);
              var targetMilliseconds = moment(targetDate, format).diff(now);
              misc.debug("Pulse start for stepId '" + restCallback.stepId + "'. Deadline: " + targetDate + " (" + targetMilliseconds + " milliseconds)");
              PULSETIMER = setTimeout(function() {
                PULSETIMER = undefined;
                misc.debug("PULSE deadline reached!!");
                var samsungSession = sessions.find({id:TARGETS.SamsungGearS});
                if ( samsungSession === undefined) {
                  misc.error(TARGETS.SamsungGearS + " session not registered for sending Stop Pulse!!!");
                  auditObj.errored++;
                  return;
                }

                var payloadObj = {
                  stepId: restCallback.stepId,
                  message: "Pulse deadline reached"
                };

                var corrId = uuid.v1();
                var requestString = REQ + SEP + TARGETS.SamsungGearS + SEP + OPS.PULSESTOP + SEP + corrId + SEP + JSON.stringify(payloadObj);
                misc.debug("Sending request to target (" + TARGETS.SamsungGearS + "): " + requestString);

                samsungSession.session.send(requestString);

                var timeout = setTimeout(function() {
                  misc.debug("TIME OUT!!!!!");
                  callbacks.remove({id: corrId});
                }, RESTCLIENTTIMEOUT);

                // Save callback
                var timeoutRestCallback = {
                  id: corrId,
                  timeout: timeout
                };
                callbacks.push(timeoutRestCallback);
              }, targetMilliseconds);
            }
            callbacks.remove({id: parsedIn.corrId});

          break;
/*
            var callback = callbacks.find({id: parsedIn.corrId});
            if ( callback === undefined) {
              misc.debug( "Response received but not found in callbacks object: " + parsedIn.corrId + ". Maybe an already timed out response?")
              break;
            }


            // Response received on time. Clear caller's timeout timer
            clearTimeout( callback.timeout);
            callbacks.remove({id: parsedIn.corrId});
          break;
*/
          default:
            misc.error("[" + parsedIn.messageType + "] Unknown message received for '" + parsedIn.target + "': " + parsedIn.op);
          break;
        }
      break;
      case NOT:
        switch  (parsedIn.target) {
          case TARGETS.ORACLE:
            // Incoming payload (a JSON stringified object) does not contain the associated IMEI
            // We need to add the "imei" field to the JSON object before sending the message
            var jsonPayload = JSON.parse(parsedIn.messagePayload);
            jsonPayload.imei = sessionData.IMEI;
            parsedIn.messagePayload = JSON.stringify(jsonPayload);
            switch  (parsedIn.op) {
              case OPS.MEDEVENT:
                ops.medUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.STEPEVENT:
                ops.stepUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.PULSEEVENT:
                ops.pulseUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.BLOODPRESSUREEVENT:
                ops.bloodPressureUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.WEIGHTEVENT:
                ops.weightUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.BATTERYEVENT:
                ops.batteryUpdate(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.SOSEVENT:
                ops.handleSOScall(parsedIn.messagePayload, sendResponse);
              break;
              case OPS.FALLEVENT:
                ops.handleFall(parsedIn.messagePayload, sendResponse);
              break;
              default:
                misc.error("[" + parsedIn.messageType + "] Unknown message received for '" + parsedIn.target + "': " + parsedIn.op);
              break;
            }
          break;
          case TARGETS.DASHBOARD:
            switch (parsedIn.op) {
              case OPS.REGISTEREVENT:
              case OPS.STEPEVENT:
              case OPS.PULSEEVENT:
              case OPS.DISTANCEEVENT:
              case OPS.WEIGHTEVENT:
              case OPS.BLOODPRESSUREEVENT:
              case OPS.NOTIFICATIONEVENT:
              case OPS.ALERTEVENT:
              case OPS.BATTERYEVENT:
              case OPS.DEVICEINFOEVENT:
                console.log("********** TODO **********");
                var targetSession = sessions.find({id:parsedIn.target});
                if ( targetSession === undefined) {
                  var errorMsg = "Invalid request. Target '" + header.target + "' hasn't yet opened a session";
                  misc.error(errorMsg);
                  return;
                }
                targetSession.session.send(parsedIn.messagePayload);
              break;
              default:
                misc.error("[" + parsedIn.messageType + "] Unknown message received for '" + parsedIn.target + "': " + parsedIn.op);
              break;
            }
          break;
          default:
            misc.error("[" + parsedIn.messageType + "] Unknown target received: '" + parsedIn.target + "'");
          break;
        }
      break;
      default:
        misc.error("Unknown message type [" + parsedIn.messageType + "] for '" + parsedIn.target + "': " + parsedIn.op);
      break;
    }

    // Shared 'sendResonse' method
    function sendResponse(code, result) {
      var result = result.replace(/\n/g, ''); // Remove any newline character
      var response = REP + SEP + sessionData.target + "," + sessionData.IMEI +  SEP + parsedIn.op + SEP + parsedIn.corrId + SEP + result;
      misc.debug("[" + sessionData.target + "," + sessionData.IMEI + "] Response to send: " + response);
      var targetSession = sessions.find({id:sessionData});
      if ( targetSession === undefined) {
        misc.error("Cannot send response. Target '[" + sessionData.target + "," + sessionData.IMEI + "]' has unexpectedly closed its session!");
        code = ERROR;
      } else {
        // We're detecting use cases where the client close/drop the connection and the server doesn't realize
        // Thus, when sending a message we get a "Error: not opened" message. We must handle this and force a close to the session
        session.send(response, function (err) {
          if ( err) {
            // Error during send message. Force session close
            auditObj.terminatedSessions++;
            misc.error("ERROR while trying to send a message!!!");
            misc.debug(util.inspect(err, true, null));
            misc.error("Forced closing session for ID ('[" + sessionData.target + "," + sessionData.IMEI + "]')");
            session.terminate();  // Force shutdown
            // Let's clean up internal structures. We don't trust that the onClose() callback gets called
            var s = sessions.find({id:sessionData});
            if ( s === undefined) {
              misc.log("Warning: current session ('[" + sessionData.target + "," + sessionData.IMEI + "]') not found!");
            } else {
              misc.debug("Removing session '[" + sessionData.target + "," + sessionData.IMEI + "]' from Session Array");
              sessions.remove({id:sessionData});
              if ( auditObj !== undefined)
                auditObj.currentSession = {} ;
            }
          }
        });
      }
      switch ( code) {
        case SUCCESS:
          auditObj.successful++;
        break;
        case ERROR:
          auditObj.errored++;
        break;
        case TIMEOUT:
          auditObj.timedout++;
        break;
        default: break;
      }
    }

  };

  return module;

};
