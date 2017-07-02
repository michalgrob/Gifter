/**
 * Created by michal on 23/03/2017.
 */
var mongoose = require('mongoose');

var Interest = require('./interest');
var Schema = mongoose.Schema;
var InGiftInter = require('./inGiftInter');
var Store= require('./Store');

var giftSchema = new Schema({
    name: String,
    prod_id: Number,
    price: Number,
    interests: [{
        interest: String,
        dynamicScore: Number,
        interestRef: {type: mongoose.Schema.Types.ObjectId, ref: 'interest'}
    }],//[require('./inGiftInter')],//require('./inGiftInter')],
    gender: String,
    store_id: String,
    store_name: String,
    maxAge: Number,
    minAge: Number,
    ImageUrl:String

});

giftSchema.pre('save', function (next) {

    var length = this.interests.length;

    for (var i = 0; i < this.interests.length; i++) {
        var currinter = this.interests[i].interest;

        var Inter = new Interest({
            name: currinter//"test"//this.interest[i]
        });
        Inter.save(function (err) {
            if (err) throw err;
            console.log('inter saved successfully!');
        });

        this.interests[i].interestRef = Inter._id;
    }

    next();
});


var Gift = mongoose.model('Gift', giftSchema);
module.exports = Gift;


