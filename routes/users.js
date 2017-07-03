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
router.get('/login', function(req, res, next) {
 var psw=req.query.psw;
 var uName=req.query.uname;

  res.render('userLogin');
   // response.render('giftsPage', {orders: orders_json,etitle : "present"});
});

router.get('/signin', function(req, res, next) {

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

        res.render('signUpPage', {orders: orders_json,etitle : "sign Up Page",LogedInUser:"Guest"});
        // response.send('giftsPage', {orders: orders_json});
    });
   // res.render('signUpPage');
    // response.render('giftsPage', {orders: orders_json,etitle : "present"});
});

router.post('/signup', function(req, res, next) {


    var newUser;
    newUser = new User();
    newUser.name= req.body.name;
    newUser.username= req.body.username;
    newUser.password= req.body.password;
    newUser.admin= false;
    newUser.age=req.body.age;
    newUser.email=req.body.email;
    newUser.interests=req.body.hobbies;
    newUser.gender=req.body.gender;


// save the user
newUser.save(function(err) {
    if (err) throw err;

   console.log('User created!');
    res.render('mainPage', {etitle : "present",LogedInUser: req.body.username});
});

    // response.send('giftsPage', {orders: orders_json});
    //res.render('signUpPage');//, {orders: orders_json,etitle : "sign Up Page"});
    // res.render('signUpPage');
    // response.render('giftsPage', {orders: orders_json,etitle : "present"});
});

module.exports = router;
