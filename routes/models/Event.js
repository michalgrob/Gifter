var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Gift = require('./Gift');
var User = require('./User');


var eventSchema = new Schema({
    title: String,
    description: String,
    gifts: [{
        isMarked: Boolean, //TRUE FOR GUEST WHO CHOSE THIS GIFT,
        markedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        gift: {type: mongoose.Schema.Types.ObjectId, ref: 'Gift'},
    }],
    hostUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    eventGuestsUsers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    created_at: Date,
    updated_at: Date,
    event_date: Date
});




eventSchema.pre('save', function(next) {
    var self = this;
    Event.find({title : self.title}, function (err, docs) {
        if (!docs.length || docs[0].id==self.id){
            // get the current date
            var currentDate = new Date();

            // change the updated_at field to current date
            self.updated_at = currentDate;

            // if created_at doesn't exist, add to that field
            if (!self.created_at)
                self.created_at = currentDate;
            console.log("event saved successfully");
            next();
        }else{
            console.log('event name exists: ',self.title);
        }
    });

});




var Event = mongoose.model('Event', eventSchema);
module.exports = Event ;