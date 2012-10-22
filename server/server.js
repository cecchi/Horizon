/* horizon, √evil made easy -- copyright twenty twelve */

// Config
var config    = require('../config.js');

// Node Modules
var exec      = require('child_process').exec,
    util      = require('util'),
    express   = require('express'),
    cron      = require('cron').CronJob;

// Models
var models = require('../server/models.js');

// Update the transaction database hourly
new cron('00 51 * * * *', function() {
  var cwd = process.cwd();
  process.chdir(__dirname);
  var update = exec('node ../update/transactions.js', {
    'stdio' : 'pipe'
  }, function (error, stdout, stderr) {
    if(error !== null || stderr.length != 0) {
      console.log('\nError: could not initialize transactions.js cron')
    }
  });
  update.stdout.on('data', function (data) {
    process.stdout.write(data);
  });
  update.stderr.on('data', function (data) {
    process.stderr.write(data);
  });
  process.chdir(cwd);
}, null, true);

// Create a REST-ful server
var app = express.createServer();

// GET/
app.get('/', function(req, res){
    res.send('<h1>Horizon</h1>');
});

// GET/transactions : Get transactions, optionally filtered by a number of parameters
app.get('/transactions', function(req, res){
  models.transaction.find().limit(30).sort('date', -1).execFind(function(arr, data) {
    res.send(data);
  });
});

// Start the server
app.listen(config.server.port, config.server.host);

console.log('> horizon server running on port 8888');