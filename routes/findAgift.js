var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
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

    interest.find({},function(err,orders) {
        if (err) throw err;
        var orders_json = [];
        orders.forEach(function(order) {
                orders_json.push({ interest: order.name});
        });
    /*Gift.find({},function(err,orders) {
        if (err) throw err;
        var orders_json = [];
        orders.forEach(function(order) {
            for(var i=0;i<order.interest.length;i++){
                orders_json.push({ interest: order.interest[i]});
            }

        });*/
        // Uses views/orders.ejs
        response.render('giftsPage', { orders: orders_json,LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
       // response.send('giftsPage', {orders: orders_json});
    });
});

/* GET home page. */
router.post('/', function(req, res, next) {
    var Interests= new Array();
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
            Interests.push(key);
        }
        counter++;
    }


  //  AddInteretToArray(vegan,'vegan',Interests);
    ////////////////////////////////////
    insertdbInterest(check1,check0);
    res.send('POST to Hello World!');
    res.render('findAgift', {LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });

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
function findGift()
{

}


function insertdbInterest(lname, fname){
    MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
        if(err) { return console.dir(err); } //handling errors
        console.log('connecting');
        var collection = db.collection('clients'); //selecting the collection
       var a = parseInt(lname);
        var doc = {"x" : a, "name" : fname }; //valid JSON ibject

        collection.insert(doc,function(err, result) {
            if(err) throw Error;
            console.log(result); //we are getting back the object inserted
        });

        collection.find({"x":555}).toArray(function(err, items) { //foreach
            console.log(items);
        });

    });
}

function findAllInterests(){
    Gift.find({},{_id:0,interest: true}, function(err, interest) {
        if (err) throw err;
        // object of all the gifts
        console.log(interest);
        return interest;
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