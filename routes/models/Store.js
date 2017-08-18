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
    //password: { type: String, required: true },
    location: String,
    store_manager_user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager'
    },
    gifts: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'Gift'
    }]
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