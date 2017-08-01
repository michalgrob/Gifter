/**
 * Created by michal on 27/03/2017.
 */
var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/sadna1');
var Schema = mongoose.Schema;

var interestSchema = new Schema({
    name: String,
    id: Number,
    category:Number

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
interestSchema.methods.addCategory= function addCategory()  {// =
    switch (this.name)
    {
        case "Arts":
        case "Music":
        case "Movies":
        case"Technology and Innovation":
        case "Singing":
        case "Dance":
        case "Drawing":
        case "Science Fiction":
        case "Filming":
        case "Religion and Theology":
        case "Education":
            this.category= 1;//Leisure
            break;
        case "Travel":
        case "Cycling":
        case "Camping & Hiking":
        case "Extreme":
        case "Swimming":
        case "Fishing":
        case "Basketball":
        case "Running":
        case "Fitness & Body Building":
        case "Skiing & Snowboarding":
        case "Soccer" :
        case "Surfing" :
            this.category=2; //Sports & Outdoors
            break;
        case "Jewelleries":
        case "Clothes":
        case "Shoes":
        case "Accessories":
        case "Optics":
        case "Makeup":
            this.category=3; //Fashion
            break;
        case "Office":
        case "Do It Yourself":
        case "Pets":
        case "Electronics":
        case "Gadgets":
        case "Cooking":
            this.category=4;
            break; //Home & Garden
        case "Reading":
        case "Collecting":
        case "Magics":
        case "Origami":
        case "Board Games":
        case "Video Games":
        case "Toys":
            this.category=5;//Indoor Hobbies
            break;
        case "Night Life":
        case "Smoking":
        case "Cultivation":
        case "Yoga":
        case "Automobiles":
        case "Alcohol":
        case "Food Culture":
            this.category=6;//Life Style
            break;


    }
};

var Interest = mongoose.model('interest', interestSchema);
module.exports = Interest;