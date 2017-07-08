module.exports = function() {

  var util = require('util')
    , url  = require('url')
    , misc = require('../../app/helpers/misc')()
    , uuid = require('node-uuid')
    , moment = require('moment')
  ;

  require("moment-duration-format");

  onLogRequest = function(req, res) {

    // Set content-type
    res.contentType('application/json');
    // Update uptime
    var now = moment().format(DATETIMEFORMAT);
    var ms = moment(now, DATETIMEFORMAT).diff(moment(AUDIT.main.startupTime,DATETIMEFORMAT));
    AUDIT.main.uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");
    res.send(JSON.stringify(AUDIT));

/**
    // Calculate uptime
    var now = moment().format(DATETIMEFORMAT);
    var ms = moment(now, DATETIMEFORMAT).diff(moment(AUDIT.main.startupTime,DATETIMEFORMAT));
    var uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");

    // Build HTML body response
    var data = '<html><body>';
    data += JSON.stringify(AUDIT);
    data += '<head><title>Realtime Healthcare - Statistics</title></head>'
    data += '<style> body { font-family: "Menlo", Courier, sans-serif;font-size: 100%;font-size: 1em;line-height: 1.25;}</style>';
    data += 'Realtime Healthcare - WebSocket Server - node.js version - ' + VERSION + '<br>';
    data += '<p>';
    data += 'Server started at ' + AUDIT.main.startupTime + '. Uptime: ' + uptime + '<br>';
    data += '<p>';
    data += 'Unhandled errors count: ' + AUDIT.main.unhandledErrors;
    data += '<p>';
    data += 'Session "SamsungGearS" statistics:';
    data += '<br>';
    data += 'Sessions: ' + AUDIT.samsungSessions.totalSessions + " (total), " + AUDIT.samsungSessions.dupSessuions + " (duplicated), " + AUDIT.samsungSessions.terminatedSessions + " (terminated)";
    if ( AUDIT.samsungSessions.currentSession.sessionId) {
      var now = moment().format(DATETIMEFORMAT);
      var ms = moment(now, DATETIMEFORMAT).diff(moment(AUDIT.samsungSessions.currentSession.uptime,DATETIMEFORMAT));
      var uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");
      data += '<p>';
      data += 'Current session data';
      data += '<p>';
      data += 'Session Id: ' + AUDIT.samsungSessions.currentSession.sessionId + ", uptime: " + uptime;
      data += '<p>';
      data += 'Requests: ' + AUDIT.samsungSessions.currentSession.requests + " (total),  " + AUDIT.samsungSessions.currentSession.successful + " (successful),  " + AUDIT.samsungSessions.currentSession.errored + " (errored),  " + AUDIT.samsungSessions.currentSession.timedout + " (timedout)";
    }
    data += '<p>';
    data += 'Session "DASHBOARD" statistics:';
    data += '<br>';
    data += 'Sessions: ' + AUDIT.dashboardSessions.totalSessions + " (total), " + AUDIT.dashboardSessions.dupSessuions + " (duplicated), " + AUDIT.dashboardSessions.terminatedSessions + " (terminated)";
    if ( AUDIT.dashboardSessions.currentSession.sessionId) {
      var now = moment().format(DATETIMEFORMAT);
      var ms = moment(now, DATETIMEFORMAT).diff(moment(AUDIT.dashboardSessions.currentSession.uptime,DATETIMEFORMAT));
      var uptime = moment.duration(ms).format("dd[d]:hh[h]:mm[m]:ss[s]");
      data += '<p>';
      data += 'Current session data';
      data += '<p>';
      data += 'Session Id: ' + AUDIT.dashboardSessions.currentSession.sessionId + ", uptime: " + uptime;
      data += '<p>';
      data += 'Requests: ' + AUDIT.dashboardSessions.currentSession.requests + " (total),  " + AUDIT.dashboardSessions.currentSession.successful + " (successful),  " + AUDIT.dashboardSessions.currentSession.errored + " (errored),  "+ AUDIT.dashboardSessions.currentSession.timedout + " (timedout)";
    }
    data += '</body></html>';
    res.send(data);
    **/
  };

  onResetRequest = function(req, res) {
    var data = 'RESET OK';
    res.send(data);
    process.exit(-1);
  };
}
