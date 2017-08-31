/**
 * Created by michal on 26/03/2017.
 */
var mongoose = require('mongoose');
var Gift = require('./Gift');
var StoreManager = require('./StoreManager');
var bcrypt   = require('bcrypt-nodejs');

var Schema = mongoose.Schema;
var storeSchema = new Schema({
    name: String,
    store_id :String,
    store_manager_user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager'
    },
    gifts: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Gift'
    }],
    location:{
        floor:Number,
        index: Number,
        img_url: String
    },
    store_image_url: String,
    is_promoted: Boolean
});

/*storeSchema.methods.generateHash = function(password) {
 return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
 };*/

/*storeSchema .methods.validPassword = function(password) {
 var bool= bcrypt.compareSync(password, this.password);
 return bool;
 };*/

var Store = mongoose.model('Store', storeSchema);
module.exports = Store;