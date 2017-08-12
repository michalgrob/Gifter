/**
 * Created by michal on 18/07/2017.
 */
var mongoose = require('mongoose');
var User = require('./User');
var Gift=require('./Gift');

// Define client as a discriminator of user
var clientSchema = User.discriminator('client', new mongoose.Schema({
        age: Number,
        interests: [String],
        events:{type: mongoose.Schema.Types.ObjectId, ref: 'Event'},
        gender: String,
        shoppingCart:[{type: mongoose.Schema.Types.ObjectId, ref: 'Gift'}]

    // return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

}));


// create the model for users and expose it to our app
module.exports = clientSchema;