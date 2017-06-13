/**
 * Created by michal on 26/03/2017.
 */
var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var storeSchema = new Schema({
    name: String,
    store_id :String,
    location: String

});
var Store = mongoose.model('Store', storeSchema);
module.exports = Store;