var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;


////////////////sapir////////////////////////////////////////////
var bodyParser = require('body-parser')
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
//router.use(express.json());
//////////////////////////////////////////

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('mainPage', {etitle : "present",LogedInUser: "Guest"});
});

/* GET home page. */
router.post('/', function(req, res, next) {

    console.log('added');
    ///////////////////////////////
    var lname = req.body.lname,
        fname = req.body.fname;
    ////////////////////////////////////
    insertdb(lname,fname);
    res.send('POST to Hello World!');
    res.render('index', {etitle : "present"});

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
function insertdb(lname, fname){
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