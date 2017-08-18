/**
 * Created by yoavf on 8/9/2017.
 */

var mongoose = require('mongoose');
var User = require('./User');
var Store = require('./Store');

var mallManagerSchema = new mongoose.Schema({
    stores: [{type: mongoose.Schema.Types.ObjectId, ref: 'Store'}],
    mall_name :String
    //    mall_stores_manager_users: [{type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager'}],
})

// Define StoreManager as a discriminator of user. It's role is 'store_manager'.
var MallManager = User.discriminator('mall_manager', mallManagerSchema);

// create the model for users and expose it to our app
module.exports = MallManager;