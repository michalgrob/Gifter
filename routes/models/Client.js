/**
 * Created by michal on 18/07/2017.
 */
var mongoose = require('mongoose');
var User = require('./User');

// Define client as a discriminator of user
var clientSchema = User.discriminator('client', new mongoose.Schema(
    {
        age: Number,
        interests: [String],
        events:{type: mongoose.Schema.Types.ObjectId, ref: 'Event'},
        gender: String,
    }));

// create the model for users and expose it to our app
module.exports = clientSchema;