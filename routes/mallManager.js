/**
 * Created by yoavf on 8/12/2017.
 */

var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
var inGiftInter=require('./models/inGiftInter');
var User=require('./models/User');
var Store=require('./models/Store');
var StoreManager=require('./models/StoreManager');
var MallManager=require('./models/MallManager');
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');
var db = mongoose.connection;
var availableStores = new Array();


// Get/Post Requests:

router.get('/', function(req, res, next) {
    getStores(req, function () {
        res.render('mallManagerPage', {
            etitle: "present",
            LogedInUser: req.user ? req.user.username : 'guest',
            CartQty: req.session.cart ? req.session.cart.totalQty : 0,
            available_stores: availableStores
        });
    });
});

router.post('/createNewStore', function(req,res,next){
    createNewStore(req);
});

router.post('/createNewStore', function(req,res,next){
    createNewStore(req);
});

router.post('/deleteStore', function(req,res,next){
    deleteStore(req);
});

router.post('/createMallManager', function(req,res,next){
    createMallManager(req);
});

router.post('/importCSV', function(req, res, next) {
    var path = req.body.path;
    var store_name = req.body.store_name;
    var store_id = req.body.store_id;

    var csvData = [];
    fs.createReadStream(path).pipe(csv()).
    on('data',function (data) {
        csvData.push(data);
    })
        .on('end',function () {
            for (i = 1; i < csvData.length; i++) {
                var prodId = csvData[i][0];
                var giftName = csvData[i][1];
                var minAge = csvData[i][2];
                var maxAge = csvData[i][3];
                var gender = csvData[i][4];
                var price = csvData[i][5];
                var imgURL = csvData[i][6];
                var storeInterests = csvData[i][7].split(";");
                createNewStore(giftName,store_name,minAge,maxAge,gender,price,storeInterests,prodId,store_id,imgURL,next)
            }
        });

    res.render('mainPage', {etitle : "present",LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});
});

function getStores(req,done){
    var currMallManagerUser = req.user;
    availableStores = [];
    var mallManagerStoreManagers = currMallManagerUser.mall_stores_manager_users;
    for(var i=0; i< mallManagerStoreManagers.length; i++){
        User.findOne(mallManagerStoreManagers[i]).exec(function (err,user) {
            var storeIDFound = user.store_id;
            Store.findOne({store_id:storeIDFound}, function (err,storeFound) {
                availableStores.push(storeFound);
                if(i == mallManagerStoreManagers.length)
                    done();
            });
            }
        )
    }
}


function createNewStore(req){
    var storeName = req.body.store_name;
    var storeManagerEmail = req.body.store_manager_email;
    var storeManagerUserName = req.body.store_manager_username;
    var storeManagerPassword = req.body.store_manager_password;
    var storeId = req.body.store_id;
    var storeLocation = req.body.store_location;

    //Create new Store:
    var newStore = new Store({
        name: storeName,
        store_id: storeId,
        location: storeLocation
    });

    //Create Store Manager User:
    var newStoreManagerUser = new StoreManager();
    newStoreManagerUser.email = storeManagerEmail;
    newStoreManagerUser.password = newStoreManagerUser.generateHash(storeManagerPassword);
    newStoreManagerUser.name = storeName;
    newStoreManagerUser.username= storeManagerUserName;
    newStoreManagerUser.admin = true;
    newStoreManagerUser.store = newStore;
    newStoreManagerUser.store_id = storeId;

    //Save it into the DB:
    Store.find({name:storeName},(function(err,stores){
        if (err) throw err;
        if (stores.length > 0) {
            console.log('Store already exists!!!');
            //alert("The store name: " + storeName + " already exists !");
        }else{
            newStore.save(function (err, done) {
                if (err) throw err;
                console.log('Store saved successfully!');

                //Save it into the DB:
                User.findOne({ email:  storeManagerEmail }, function(err, user) {
                    if (err) throw err;
                    if (user) {
                        console.log('User email is already in use.!');
                        return done(null, false, req.flash('signupMessage', 'That email is already in use.'));
                    } else {
                        newStoreManagerUser.save(function (err, done) {
                            if (err)throw err;
                            console.log('Store Manager User created successfully!');
                        });

                        //Save store_manager_user in mall_manager
                        User.findOne({email:storeManagerEmail},function(err, user_saved){
                            if (err) throw err;
                            var savedStoreManager = user_saved;

                            var mallManagerEmail = req.mall_manager_email;
                            User.findOne({email:mallManagerEmail},function(err, mall_manager_user){
                                if (err) throw err;
                                var mallManagerUser = req.user;
                                mallManagerUser.mall_stores_manager_users.push(savedStoreManager);
                            });
                        });
                    }});
            });
        }
    }));
}


function deleteStore(req) {
    var storeName = req.body.store_name;
    var storeManagerEmail = req.body.store_manager_email;
    //var storeManagerUserName = req.body.store_manager_username;
    //var storeManagerPassword = req.body.store_manager_password;
    //var storeId = req.body.store_id;
    //var storeLocation = req.body.store_location;

    //Delete User from DB:
    User.find({email: storeManagerEmail}).remove().exec(function (err, data) {
        if (err) {
            throw err;
        }
    });

    //Delete Store from DB:
    Store.find({name: storeName}).remove().exec(function (err, data) {
        if (err) {
            throw err;
        }
    });
}

function createMallManager(req){

    var mallName = req.body.store_name;
    var mallManagerEmail = req.body.store_manager_email;
    var mallManagerUserName = req.body.store_manager_username;
    var mallManagerPassword = req.body.store_manager_password;

    //Create Mall Manager User:
    var newMallManagerUser = new MallManager();

    newMallManagerUser.mall_name = mallName;
    newMallManagerUser.email = mallManagerEmail;
    newMallManagerUser.password = newMallManagerUser.generateHash(mallManagerPassword);
    newMallManagerUser.name = "Azrieli Manager";
    newMallManagerUser.username= mallManagerUserName;
    newMallManagerUser.admin = true;
    newMallManagerUser.mall_stores_manager_users;

    //Save it into the DB:
    User.find({role:"store_manager"},function(err,users) {
        if (err) throw err;
        newMallManagerUser.mall_stores_manager_users = users;

        newMallManagerUser.save(function (err, done) {
            if (err)throw err;
            console.log('Mall Manager User created successfully!');
        });
    });
}

router.get('/shopping-cart',function(req,res,next){
    if(!req.session.cart){
        return res.render('shoppingCartPage',{LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 , products: null});
    }
    var cart = new Cart(req.session.cart);
    var gifts = cart.generateArray();
    req.session.cart = cart;
    console.log(req.session.cart);
    var totPrice = cart.totalPrice;
    res.render('shoppingCartPage',{LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 , products: gifts,totalPrice: totPrice});
});

module.exports = router;
