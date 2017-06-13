
var mongoose = require('mongoose');
var Interest = require('./interest');
//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var inGiftInterSchema = new Schema({
    interest: String,
    dynamicScore: Number,
    interestRef : { type : mongoose.Schema.Types.ObjectId, ref: 'interest'}
});

inGiftInterSchema.pre('save', function(next) {

    Interest.findOne({name: this.name}, function (err, docs) {
        if (docs.length) {
            // cb('interest exists already',null);
            this.interestRef=docs._doc._id;
            next();
        }
        else {
            var currinter = this.interest;
            var Inter = new Interest({
                name: currinter
            });
            Inter.save(function (err) {
                if (err) throw err;

            });
            this.interestRef=Inter._id;
            next();
        }

    });

});
// inGiftInterSchema.pre('save', function(next) {
//
//         var currinter=this.interest;
//         var Inter = new Interest({
//             name: currinter//"test"//this.interest[i]
//         });
//         Inter.save(function(err) {
//             if (err) throw err;
//             //this.interestRef.push()
// 			next();
//             //console.log('inter saved successfully!');
//         });
//
// });

/*inGiftInterSchema.pre('save', function(next) {
    inGiftInterSchema.count({name : this.name}, function (err, count){
        if(count>0){
            console.log('inter already exist');
            //document exists });
        }
        else
        {
            console.log("inter doesn't exist");
            Interest.count({}, function (err, count){
                this.id= count+1;
                console.log( "Number of interst:", count+1 );
                console.log( "new id:", this.id );
                next();
            });

        }
    });




});*/

var InGiftInterSchema = mongoose.model('inGiftInterSchema', inGiftInterSchema);
module.exports = InGiftInterSchema;
