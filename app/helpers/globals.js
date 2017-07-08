module.exports = function() {

  // Global variables
  global.VERSION        = 'v2.1.0';

  // Properties
  global.PROPERTIESFILE = 'rhws.conf';
  global.pDEBUG         = 'main.debug';
  global.pWSPORT        = 'ws.port';
  global.pWSSSL         = 'ws.ssl';
  global.pRESTPORT      = 'rest.port';
  global.pRESTSSL       = 'rest.ssl';
  global.pSBHOST        = 'sb.host';
  global.pSBPORT        = 'sb.port';

  global.STARTUPTIME    = "";
  global.DATETIMEFORMAT = 'DD/MM/YYYY HH:mm:ss.SSS';
  global.DEBUG          = false;
  global.DONTDEBUGPING  = true;
  global.incomingUrl    = '';
  global.sessions       = [];
  global.callbacks      = [];
  global.SUCCESS        = 0;
  global.ERROR          = -1;
  global.TIMEOUT        = -2;

  // Hosts
  global.config = { ws: {
                          port: 8280,
                          ssl: false,
                          URI: '/websocketsmulti/event'
                    } ,
                    rest: {
                          port: 8221,
                          ssl: false,
                          URI: '/websocketsmulti/resources/websockets/rest/send'
                    } ,
                    console: {
                          port: 8222,
                          ssl: false,
                          URI: '/websocketsmulti/console',
                          apps: {
                            log: '/statistics',
                            reset: '/reset'
                          }
                    } ,
                    sb: {
//                      host: 'bpm12c',
                      host: 'osb.iot',
                      port:'8021'
                    }
                  };

  // Statistics

  global.COUNTER = [
/**
    {
      deviceType : "",
      deviceId   : "",
      counter    : 0
    }
**/
  ];

  global.AUDIT = {
    main: {
      version         : VERSION,
      startupTime     : "",
      uptime          : "",
      erroredSessions : 0,
      unhandledErrors : 0
    },
    samsungSessions: {
      totalSessions      : 0,
      dupSessions        : 0,
      terminatedSessions : 0,
      sessions: [
/**
        {
          deviceId    : "",
          deviceName  : "",
          sessionId   : "",
          startupTime : "",
          endTime     : "",
          uptime      : "",
          requests    : 0,
          successful  : 0,
          errored     : 0,
          timedout    : 0
        }
**/
      ]
    },
    dashboardSessions : {
      totalSessions      : 0,
      dupSessions        : 0,
      terminatedSessions : 0,
      sessions: [
/**
        {
          deviceId    : "",
          sessionId   : "",
          startupTime : "",
          endTime     : "",
          uptime      : "",
          requests    : 0,
          successful  : 0,
          errored     : 0,
          timedout    : 0
        }
**/
      ]
    },
    restServer: {
      successful   : 0,
      errored      : 0,
      timedout     : 0
    }
  };

  // Timeouts
  global.RESTCLIENTTIMEOUT = 10000;

  // Pulse timer globals
  global.PULSETIMER = undefined;

  // Protocol globals
  global.SESSIONSEP = ',';
  global.SEP        = '|';
  global.ACK        = 'ACK';
  global.ERR        = 'ERR';
  // Message types
  global.REQ  = "REQ";
  global.REP  = 'REP';
  global.NOT  = 'NOT';
  // Valid sessions
  global.VALIDSESSIONS = [ "SamsungGearS", "DASHBOARD" ];
  // Targets
  global.TARGETS = {
    SamsungGearS : "SamsungGearS",
    ORACLE       : "ORACLE",
    DASHBOARD    : "DASHBOARD"
  }
  // Operations
  global.OPS = {
    REGISTER             : "REGISTER",
    DEREGISTER           : "DEREGISTER",
    SYNCHRONIZE          : "SYNCHRONIZE",
    MEDSTART             : "MEDSTART",
    STEPSTART            : "STEPSTART",
    PULSESTART           : "PULSESTART",
    MEDSTOP              : "MEDSTOP",
    STEPSTOP             : "STEPSTOP",
    PULSESTOP            : "PULSESTOP",
    PING                 : "PING",
    REGISTEREVENT        : "REGISTEREVENT",
    MEDEVENT             : "MEDEVENT",
    STEPEVENT            : "STEPEVENT",
    PULSEEVENT           : "PULSEEVENT",
    PULSEAVGEVENT        : "PULSEAVGEVENT",
    BLOODPRESSUREEVENT   : "BLOODPRESSUREEVENT",
    DISTANCEEVENT        : "DISTANCEEVENT",
    FALLEVENT            : "FALLEVENT",
    FALLWARN             : "FALLWARN",
    BLOODPRESSUREREQUEST : "BLOODPRESSUREREQUEST",
    WEIGHTREQUEST        : "WEIGHTREQUEST",
    WEIGHTEVENT          : "WEIGHTEVENT",
    MESSAGEEVENT         : "MESSAGEEVENT",
    NOTIFICATIONEVENT    : "NOTIFICATIONEVENT",
    ALERTEVENT           : "ALERTEVENT",
    BATTERYEVENT         : "BATTERYEVENT",
    SOSEVENT             : "SOSEVENT",
    INFOREQUEST          : "INFOREQUEST",
    PULSEWARN            : "PULSEWARN",
    DEVICEINFOEVENT      : "DEVICEINFOEVENT",
    GETPULSETHRESHOLDS   : "GETPULSETHRESHOLDS",
    SETPULSETHRESHOLDS   : "SETPULSETHRESHOLDS"
  };

}
