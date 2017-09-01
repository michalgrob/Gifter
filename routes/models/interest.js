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
        case "arts":
        case "music":
        case "movies":
        case"technology and innovation":
        case "singing":
        case "dance":
        case "drawing":
        case "science fiction":
        case "filming":
        case "religion and theology":
        case "education":
            this.category= 1;//Leisure
            break;
        case "travel":
        case "cycling":
        case "camping & hiking":
        case "extreme":
        case "swimming":
        case "fishing":
        case "basketball":
        case "running":
        case "fitness & body building":
        case "skiing & snowboarding":
        case "soccer" :
        case "surfing" :
            this.category=2; //Sports & Outdoors
            break;
        case "jewelleries":
        case "clothes":
        case "shoes":
        case "accessories":
        case "optics":
        case "makeup":
            this.category=3; //Fashion
            break;
        case "office":
        case "do it yourself":
        case "pets":
        case "electronics":
        case "gadgets":
        case "cooking":
            this.category=4;
            break; //Home & Garden
        case "reading":
        case "collecting":
        case "magics":
        case "origami":
        case "board games":
        case "video games":
        case "toys":
            this.category=5;//Indoor Hobbies
            break;
        case "night life":
        case "smoking":
        case "cultivation":
        case "yoga":
        case "automobiles":
        case "alcohol":
        case "food culture":
            this.category=6;//Life Style
            break;


    }
};

var Interest = mongoose.model('interest', interestSchema);
module.exports = Interest;