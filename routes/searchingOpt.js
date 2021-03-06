var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
var inGiftInter=require('./models/inGiftInter');
//mongoose.connect('mongodb://localhost/test');
//var db = mongoose.connection;
/*
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
}); */
////////////////////////////////////////////////////////////
var bodyParser = require('body-parser')
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));



router.get('/', function(request, response, next) {
  //addNewGift();
  //  addNewGift2();
    //AddUrlToGift();
    interest.find({},function(err,orders) {
        if (err) throw err;
        var orders1_json = [];
        var orders2_json = [];
        var orders3_json = [];
        var orders4_json = [];
        var orders5_json = [];
        var orders6_json = [];
        orders.forEach(function(order) {
            // orders_json.push({ interest: order.name ,category: order._doc.category});

            switch(order._doc.category) {
                case 1:
                    orders1_json.push({ interest: order.name});
                    break;
                case 2:
                    orders2_json.push({ interest: order.name});
                    break;
                case 3:
                    orders3_json.push({ interest: order.name});
                    break;
                case 4:
                    orders4_json.push({ interest: order.name});
                    break;
                case 5:
                    orders5_json.push({ interest: order.name});
                    break;
                case 6:
                    orders6_json.push({ interest: order.name});
                    break;
                default:
                    orders1_json.push({ interest: order.name});
                    break;
            }
        });

        response.render('giftsPage', {
            orders1: orders1_json,
            orders2: orders2_json,
            orders3: orders3_json,
            orders4: orders4_json,
            orders5: orders5_json,
            orders6: orders6_json,
            LogedInUser: request.user ? request.user : '',
            CartQty: request.session.cart ? request.session.cart.totalQty : 0  })
    });
});

/* GET home page. */
router.post('/', function(req, res, next) {
    var interests= new Array();
    var price;
    var age;
    var gender;
    //console.log('added');
    var counter=0;
    for(var key in req.body) {
        //var v=req.body[key];
        if(counter==0) {
            gender=key;
        }
        if(counter==1){
            price=key;
        }
        if(counter==2){
            age=key;
        }
        else if(counter>2) {
            interests.push(key);
        }
        counter++;
    }
    //var age = age.split(" ");
/////////parse params/////////////
    var agesArray = age.split('_'),
        minAge = agesArray[1],
        maxAge = agesArray[agesArray.length - 1];

    var pricrArray = price.split('_'),
        minPrice = pricrArray[1],
        maxPrice = pricrArray[pricrArray.length - 1];
    ////////////////////////////////////



  //  insertdbInterest(check1,check0);
    res.send('After to Hello World!');
    res.render('searchingOpt', {LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0});

});

//////////////////////////////////////////////////try
var bodyParser = require('body-parser')
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
//router.use(express.json());
// or       POST: {"name":"foo","color":"red"}  <— JSON encoding


/////////////////////////////////try

module.exports = router;

function AddInteretToArray(val,name,InterestsArray)
{
    if(val=="1")
    {
        InterestsArray.push(name);
    }
}



function findAllInterests(){
    Gift.find({},{_id:0,interest: true}, function(err, interest) {
        if (err) throw err;
        // object of all the gifts
        console.log(interest);
        return interest;
    });

}
function addNewGift2(){

    var cookBook = new Gift();

    cookBook.name = "CookBook ",
        cookBook.prod_id = 4,
        cookBook.price = 150,
        cookBook.gender = "b",
        cookBook.store_id = "3",
        cookBook.store_name = "Stimatzkey",
        cookBook.minAge= 20,
        cookBook.maxAge=50,
        cookBook.ImageUrl="img/gifts/fullsize/CookBook.jpg";

    cookBook.interests.push({interest: "fashion", dynamicScore: 0});
    cookBook.interests.push({interest: "cooking", dynamicScore: 1});
    cookBook.interests.push({interest: "travel", dynamicScore: 1});
    cookBook.interests.push({interest: "reading", dynamicScore: 0});

    cookBook.save(function(err) {
        if (err) throw err;

        console.log('Gift saved successfully!');
    });
}
function addNewGift(){

    var cookBook = new Gift();
    cookBook.name = "Tshirt ",
        cookBook.prod_id = 3,
    cookBook.price = 120,
    cookBook.gender = "b",
    cookBook.store_id = "5",
    cookBook.store_name = "ZARA",
    cookBook.minAge= 16,
        cookBook.maxAge=21,
        cookBook.ImageUrl="img/gifts/fullsize/Tshirt.jpg";
    cookBook.interests.push({interest: "fashion", dynamicScore: 1});
    cookBook.interests.push({interest: "cooking", dynamicScore: 0});
    cookBook.interests.push({interest: "travel", dynamicScore: 0});
    cookBook.interests.push({interest: "reading", dynamicScore: 0});

    cookBook.save(function(err) {
        if (err) throw err;

        console.log('Gift saved successfully!');
    });
}

function AddUrlToGift() {
    Gift.find({},function(err,gifts) {
        if (err) throw err;
        //var orders_json = [];
        gifts.forEach(function(gift) {
            //orders_json.push({ interest: order.name});
            var imgUrl;
            // if(gift'CookBook'))
            // {
                 imgUrl="img/gifts/fullsize/CookBook.jpg"
            // }
            // if(gift.name=='Tshirt')
            // {
            //     imgUrl="img/gifts/fullsize/Tshirt.jpg"
            // }
            gift.ImageUrl=imgUrl;
            gift.save;
        });
        gifts.save
        /*Gift.find({},function(err,orders) {
         if (err) throw err;
         var orders_json = [];
         orders.forEach(function(order) {
         for(var i=0;i<order.interest.length;i++){
         orders_json.push({ interest: order.interest[i]});
         }
         });*/
        // Uses views/orders.ejs

       // response.render('giftsPage', {orders: orders_json,LogedInUser: "Guest"});
        // response.send('giftsPage', {orders: orders_json});
    });

}

/*add gifts to DB code
 var cookBook = new Gift({
 name : "TECHNICAL PACKS SHADOW 40+10 ",
 prod_id : 7.0,
 price : 600.0,
 interest : [
 "sports",
 "travel"
 ],
 gender : "b",
 store_id : "6",
 store_name : "The North Face",
 age: 20
 });


 cookBook.save(function(err) {
 if (err) throw err;

 console.log('Gift saved successfully!');
 });
* */