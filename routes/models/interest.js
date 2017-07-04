/**
 * Created by michal on 27/03/2017.
 */
var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var interestSchema = new Schema({
    name: String,
    id: Number,

});


interestSchema.pre('save', function(next) {
    Interest.count({name : this.name}, function (err, count){
        if(count>0){
            console.log('inter already exist');
        }
        else
        {
            console.log("inter doesn't exist");
            next();

        }
    });

});

var Interest = mongoose.model('interest', interestSchema);
module.exports = Interest;