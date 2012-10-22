var config = require('../config.js'),
    casper = require('casper').create();

casper.echo('Connecting to Mint...');
casper.start('https://wwws.mint.com/login.event', function() {
  this.echo(' >> Done.\n')
  this.echo('Signing in...');
  this.fill('form#form-login', { 
    username: config.user.username,
    password: config.user.password
  }, true);
}).thenOpen('https://wwws.mint.com/transaction.event', function() {
  this.echo(' >> Done.\n');
  this.waitForSelector('#localnav-acounts li:not(:first-child)', function() {
    this.echo('Finding accounts...')
    var accounts = this.evaluate(function() {
      return Array.prototype.slice.call(
        document.querySelectorAll('#localnav-acounts li'), 1
      ).map(function(el) {
        return {
          'id'   : el.id.replace(/account\-/, ''),
          'name' : el.querySelector('a').innerHTML
        }
      });
    });
    for(i in accounts) {
      this.echo('Account: ' + accounts[i]['name'] + ' (' + accounts[i]['id'] + ')');
      this.echo(' >> Downloading transaction history...');
      this.download(
        'https://wwws.mint.com/transactionDownload.event?accountId=' + accounts[i]['id'] + '&comparableType=8',
        'data/' + accounts[i]['id'] + '.csv'
      );
      this.echo(' >> Done.\n');
    }
  });
});

casper.run(function() {
  this.echo('Done.').exit();
});
