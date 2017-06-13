var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
var inGiftInter=require('./models/inGiftInter');
var User=require('./models/User');

/* GET users listing. */
// router.get('/login', function(req, res, next) {
//     var psw=req.query.psw;
//     var uName=req.query.uname;
//
//     res.render('userLogin');
//     // response.render('giftsPage', {orders: orders_json,etitle : "present"});
// });

router.get('/login', function(req, res, next) {

    var x=0;
    var uName=req.query.sname;

        res.render('storeInfoPage', {etitle : "Stroe Page",LogedInUser:uName});

});



module.exports = router;
