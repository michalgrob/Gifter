/**
 * Created by michal on 26/03/2017.
 */
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: Boolean,
    age: Number,
    email: { type: String, unique: true, required: true },
    interests: [String],
    created_at: Date,
    updated_at: Date,
    events:{type: mongoose.Schema.Types.ObjectId, ref: 'Event'},
    gender: String,

});
// on every save, add the date
userSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at)
        this.created_at = currentDate;

    next();
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

var User = mongoose.model('User', userSchema);
module.exports = User;