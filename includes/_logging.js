var bunyan = require('bunyan');
var join = require('path').join
  , logpath = join(__dirname, '../mhp-logs/mhp-nodejs.log');

var log = bunyan.createLogger({
      name: 'mhp-nodejs-api', 
      streams: [{
          level: 'info',
          stream: process.stdout  
        },
        {
          level: 'error', 
          type: 'rotating-file',
          period: '1d', 
          path: logpath
        }]
  });
  
  exports.log=log;