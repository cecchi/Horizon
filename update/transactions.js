// Node Modules
var exec      = require('child_process').exec,
    fs        = require('fs'),
    path      = require('path'),
    lazy      = require('lazy'),
    emitter   = require('events').EventEmitter,
    events    = new emitter();

// Models
var models = require('../server/models.js');

// Change to this script's directory
process.chdir(__dirname);

// Run CasperJS as a child process
console.log('Starting CasperJS...');
var casper = exec('casperjs ' + __dirname + '/scrape.js', {
  'stdio' : 'pipe'
}, function (error, stdout, stderr) {
  if(error === null && stderr.length === 0) {
    console.log('\nScraping completed successfully. Data files prepared.\n');
    events.emit('data-ready');
  } else {
    console.log('\nSomething went wrong!')
  }
});

// Prefix stdout from Casper
var first  = true,
    prefix = ' :: ';
casper.stdout.on('data', function (data) {
  process.stdout.write((first ? (first = false) || prefix : '') + data.replace(/\n/g, '\n' + prefix));
});

casper.stderr.on('data', function (data) {
  process.stderr.write((first ? (first = false) || prefix : '') + data.replace(/\n/g, '\n' + prefix));
});

// Empty and rebuild transactions collection
events.on('data-ready', function() {
  console.log('Emptying transactions collection...');
  var transactions = new models.transaction();
  transactions.collection.remove();

  console.log(' >> Done.\n')

  fs.readdir('data/', function(err, files) {
    if(err) throw err;

    // Make sure we're only dealing with .csv's
    files = files.filter(function(file) {
      return path.extname(file) == '.csv';
    });

    // Keep track of active file streams
    var active;
    if(!(active = files.length)) {
      console.log('No accounts found.');
      setTimeout(function() {
        process.exit();
      }, 400);
    }

    // Iterate each line of each file and insert as a new transaction
    var columns = ['date', 'description', 'original_description', 'amount', 'type', 'category', 'account'],
        l       = 0;
    files.forEach(function(file) {
      file = 'data/' + file;

      // Convert file stream to list of lines (Strings)
      console.log('Parsing ' + file + '...');
      var stream = fs.createReadStream(file);

      // Whenever a stream closes, see if it's the last one
      stream.on('end', function() {
        stream.destroy();

        // Delete the data file after reading
        console.log('Completed parsing ' + file + '... deleted.');
        fs.unlink(file);

        if(--active === 0) {
          console.log('\nDone. ' + l + ' transactions added.');
          setTimeout(function() {
            process.exit();
          }, 1200);
        }
      })

      // Convert file stream to list of lines (Strings)
      new lazy(stream).lines.map(String).skip(1).forEach(function(line) {
        // JSON hack, but saves us having to deal with the problem of escaped commas (instead of using .split(','))
        var record = JSON.parse('[' + line.replace(/\\/g, '\\\\').toString() + ']');

        // Create a new transaction model
        var transaction = new models.transaction();
        columns.forEach(function(column, index) {
          transaction[column] = record[index];
        });

        // Save to the database
        transaction.save();
        l++;
      });
    });
  });
});