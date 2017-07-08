module.exports = function() {

  var util = require('util')
    , url  = require('url')
    , misc = require('../../app/helpers/misc')()
    , uuid = require('node-uuid')
    , moment = require('moment')
  ;

  onRestRequest = function(req, res) {

    // Set content-type
    res.contentType('application/json');

    misc.debug("[REST] Incoming request: " + JSON.stringify(req.body));

    var validateResult = validateInput(req.body);
    if ( validateResult !== "") {
      misc.error(validateResult);
      var responseMsg = JSON.stringify({result: ERROR, detail: validateResult});
      misc.debug("[REST] Sending response: " + responseMsg);
      res.send(responseMsg);
      return;
    }

    var header = req.body.header;
    var data = {};

    if ( header.op !== OPS.INFOREQUEST) {
      if ( !req.body.data) {
        var errorMsg = "Element {data} not found";
        misc.error(errorMsg);
        var responseMsg = JSON.stringify({result: ERROR, detail: errorMsg});
        misc.debug("[REST] Sending response: " + responseMsg);
        res.send(responseMsg);
        return;
      } else {
        data = req.body.data;
      }
    }

    var messageType = ( header.target === TARGETS.DASHBOARD) ? NOT : REQ;

    // Check if the target session is currently Opened
    var sessionData =  {
      target : header.target,
      IMEI   : header.IMEI,
      status : "OK"
    };
    var targetSession = sessions.find({id:sessionData});

    if ( targetSession === undefined) {
      var errorMsg = "Invalid request. Target '[" + sessionData.target + "," + sessionData.IMEI + "]' hasn't yet opened a session";
      misc.error("[REST] " + errorMsg);
      var responseMsg = JSON.stringify({result: ERROR, detail: errorMsg});
      misc.debug("[REST] Sending response: " + responseMsg);
      res.send(responseMsg);
      return;
    }

    var timeout = RESTCLIENTTIMEOUT;

    // Handle special PULSESTOP and PULSEWARN incoming ops
    if ( header.op === OPS.PULSESTOP) {
      // If we receive a PULSESTOP, let's stop the timer, if needed
      if ( PULSETIMER !== undefined) {
        misc.debug("[REST] Cancelling running timer!!");
        clearTimeout(PULSETIMER);
        PULSETIMER = undefined;
      } else {
        // No timer enabled. Do nothing and return the right response
        var responseMsg = JSON.stringify({result: ERROR, detail: "PULSESTOP requested with no timer running"});
        misc.debug("[REST] Sending response: " + responseMsg);
        res.send(responseMsg);
        return;
      }
    }

    if ( header.op === OPS.PULSEWARN || header.op === OPS.FALLWARN) {
      // PULSEWARN comes with its own timeout
      if ( !data.responseTimeout) {
        var errorMsg = "Element {data.responseTimeout} not found";
        misc.error(errorMsg);
        var responseMsg = JSON.stringify({result: ERROR, detail: errorMsg});
        misc.debug("[REST] Sending response: " + responseMsg);
        res.send(responseMsg);
        return;
      } else
        timeout = data.responseTimeout * 1000;
    }

    // Need to fix the lack of TIMEZONE settings in the treatment!
    if ( header.op === OPS.SYNCHRONIZE) {

      console.log(util.inspect(data, true, null));

      var orgTime = data.timestamp;
      data.steps.forEach((step) => {
        step.stepDetails.startTime = moment(step.stepDetails.startTime).utcOffset(orgTime,true).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        step.stepDetails.deadline = moment(step.stepDetails.deadline).utcOffset(orgTime,true).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      });

      console.log(util.inspect(data, true, null));

    }

    var corrId = uuid.v1();
    var request = messageType + SEP + targetSession.id.target + "," + targetSession.id.IMEI + SEP + header.op + SEP + corrId + SEP + JSON.stringify(data);
    // Send actual request to target
    misc.debug("[REST] Sending request to target ([" + targetSession.id.target + "," + targetSession.id.IMEI + "]): " + request + " - timeout: " + timeout);
    targetSession.session.send(request);

    var timeoutTimer = setTimeout(function() {
      misc.debug("TIME OUT!!!!!");
      callbacks.remove({id: corrId});
      var responseMsg = JSON.stringify({result: TIMEOUT, detail: "Time out (" + (RESTCLIENTTIMEOUT/1000) + " sec.) awaiting for response"});
      misc.debug("[REST] Sending response: " + responseMsg);
      res.send(responseMsg);
    }, timeout);

    // Save callback
    var restCallback = {
      id: corrId,
      restSession: res,
      timeout: timeoutTimer
    };

    // If PULSESTART, send the target datetime over the restCallback object
    if ( header.op === OPS.PULSESTART) {
      restCallback.stepId = data.stepId;
      restCallback.pulsestartTarget = data.deadline;
    }

    callbacks.push(restCallback);

  };

  function validateInput(body) {
    if ( !body.header)
      return "Element {header} not found";
    if ( !body.header.op)
      return "Element {header.op} not found";
    if ( OPS[body.header.op] === undefined)
      return "Invalid operation: " + body.header.op;
    if ( !body.header.target)
      return "Element {header.target} not found";
    if ( TARGETS[body.header.target] === undefined)
      return "Invalid target: " + body.header.target;
    return "";
  }

}
