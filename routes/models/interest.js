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
            //next();//document exists });
        }
        else
        {
            console.log("inter doesn't exist");
            // Interest.count({}, function (err, count){
            //     this.id= count+1;
            //     console.log( "Number of interst:", count+1 );
            //     console.log( "new id:", this.id );
            //     next();
            // });
            next();


        }
    });



    /*
    Interest.find({name : this.name}, function (err, docs) {
        if (docs.length){
            cb('interest exists already',null);
        }else{
            next();
        }
    });*/
});

var Interest = mongoose.model('interest', interestSchema);
module.exports = Interest;