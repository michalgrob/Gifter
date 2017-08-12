/**
 * Created by yoavf on 8/9/2017.
 */

var mongoose = require('mongoose');
var User = require('./User');

var mallManagerSchema = new mongoose.Schema({
    mall_stores_manager_users: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager'
    }],
    mall_name :String
})

// Define StoreManager as a discriminator of user. It's role is 'store_manager'.
var MallManager = User.discriminator('mall_manager', mallManagerSchema);

// create the model for users and expose it to our app
module.exports = MallManager;