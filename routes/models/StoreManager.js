/**
 * Created by michal on 18/07/2017.
 */
var mongoose = require('mongoose');
var User = require('./User');


// Define StoreManager as a discriminator of user
var storeManagerSchema = User.discriminator('storeManager', mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "store" },
    store_id :String,

}));

// create the model for users and expose it to our app
module.exports = storeManagerSchema;