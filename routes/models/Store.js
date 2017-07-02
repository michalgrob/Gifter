/**
 * Created by michal on 26/03/2017.
 */
var mongoose = require('mongoose');
var Gift = require('./Gift');
//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var storeSchema = new Schema({
    name: String,
    store_id :String,
    location: String,
    gifts: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'Gift'
    }]

});
var Store = mongoose.model('Store', storeSchema);
module.exports = Store;