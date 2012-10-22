// Config
var config    = require('../config.js');

// Node modules
var mongoose  = require('mongoose');

// Mongoose
var db        = mongoose.connect(config.db.uri),
    Schema    = mongoose.Schema;

function addModel(name, schema, collection) {
  module.exports[name] = mongoose.model(name, new Schema(schema), collection);
}

addModel('transaction', {
  date                  : Date,
  description           : String,
  original_description  : String,
  amount                : Number,
  type                  : {
    type : String, 
    enum : ['debit', 'credit']
  },
  category              : String,
  account               : String
}, 'transactions');