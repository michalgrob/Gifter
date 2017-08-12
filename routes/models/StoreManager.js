/**
 * Created by michal on 18/07/2017.
 */
var mongoose = require('mongoose');
var User = require('./User');

var storeManagerSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    store_id :String,
})

// Define StoreManager as a discriminator of user. It's role is 'store_manager'.
var StoreManager = User.discriminator('store_manager', storeManagerSchema);

// create the model for users and expose it to our app
module.exports = StoreManager;