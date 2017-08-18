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
var StoreManager = require('./models/StoreManager');
var MallManager = require('./models/MallManager');
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
    sleep(1000);
    res.redirect("/users/redirect_user_by_role");
});

router.post('/deleteStore', function(req,res,next){
    deleteStore(req);
    sleep(1000);
    res.redirect("/users/redirect_user_by_role");
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
    var currMallManagerUserEmail = req.user.email;
    availableStores = [];
    var iterations = 0;
    User.findOne({email:currMallManagerUserEmail})
        .populate('stores')
        .exec(function(err, mall_manager_user) {
            if (err) throw err;
            var mallStores = mall_manager_user.stores;
            for (var i = 0; i < mallStores.length; i++) {
                availableStores.push(mallStores[i]);
            }
            done();
        });
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

    newStore.store_manager_user = newStoreManagerUser;

    //If the store & user doesn't exist in DB - Save it into the DB:
    Store.findOne({name:storeName},(function(err,store){
        if (err) throw err;
        if (store) {
            console.log('Store already exists!!!');
        }else{
            User.findOne({ email:  storeManagerEmail }, function(err1, user) {
                if (err1) throw err;
                if (user) {
                    console.log('User email is already in use.!');
                }
            });

            // Save new store:
            newStore.save(function (err, done) {
                if (err) throw err;
                console.log('Store saved successfully!');
                connectStoreToMallManager(req,newStore);
            });

            // Save new store manager user:
            newStoreManagerUser.save(function (err){
                if (err)throw err;
                console.log('Store Manager User created successfully!');
                //insterStoreManagerToMallManagerUsersArray(req,newStoreManagerUser);
            });
        }
    }));
}

function connectStoreToMallManager(req, newStore) {
    var mallManagerEmail = req.user.email;
    User.findOne({email:mallManagerEmail}).exec(function(err, mall_manager_user){
        if (err) throw err;
        var mallManagerStoresArray = mall_manager_user.stores;
        mallManagerStoresArray.push(newStore);
        console.log('Store was connected to Mall manager!');
        mall_manager_user.save();
    });
}


function deleteStore(req) {
    var currMallManagerEmail = req.user.email;
    var storeName = req.body.store_name;

    var storeObject;

    //Delete Store from DB:
    //1. Search in the DB:
    Store.findOne({name: storeName})
        .populate()
        .exec(function (err, store) {
            if (err) throw err;
            storeObject = store;

            //2. Delete Store Manager User:
            var storeManagerUser = store.store_manager_user;
            User.findOneAndRemove(storeManagerUser, function (err) {
                if (err)  throw err;
            });

            //3.Disconnect Store Manager from the Mall Manager:
            User.findOne({email: currMallManagerEmail})
                .exec(function (err, mallManager) {
                    if (err)  throw err;
                    mallManager.stores.pop(storeObject);
                    mallManager.save();

                    //4. Delete Store:
                    Store.findOneAndRemove({name: storeName}, function (err) {
                        if (err)  throw err;
                    });
                    console.log('Store was successfully deleted!');
                });
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

    newMallManagerUser.save(function (err, done) {
        if (err)throw err;
        console.log('Mall Manager User created successfully!');
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


function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

/*


function getStores1(req,done){
    var currMallManagerUser = req.user;
    availableStores = [];
    var mallManagerStoreManagers = currMallManagerUser.mall_stores_manager_users;
    for(var i=0; i< mallManagerStoreManagers.length; i++){
        User.findOne(mallManagerStoreManagers[i]).exec(function (err,user) {
                if(err) throw err;
                if(user == null){
                    done();
                }else{
                    var storeIDFound = user.store_id;
                    Store.findOne({store_id:storeIDFound}, function (err,storeFound) {
                        availableStores.push(storeFound);
                        if(i == mallManagerStoreManagers.length)
                            done();
                    });
                }
            }
        )
    }
}

function getStores2(req,done){
    var currMallManagerUserEmail = req.user.email;
    availableStores = [];
    var iterations = 0;
    User.findOne({email:currMallManagerUserEmail})
        .populate()
        .exec(function(err, mall_manager_user) {
            if (err) throw err;
            var mallManagerStoreManagers = mall_manager_user.mall_stores_manager_users;
            if(mallManagerStoreManagers.length == 0){
                done();
            }else{
                for (var i = 0; i < mallManagerStoreManagers.length; i++) {
                    User.findOne(mallManagerStoreManagers[i])
                        .populate('store')
                        .exec(function (err,user) {
                            iterations++;
                            var currStore = user.store;
                            availableStores.push(currStore);
                            if(iterations == mallManagerStoreManagers.length)
                                done();
                        });
                }
            }
        });
}
*/

/*function insterStoreManagerToMallManagerUsersArray(req, newStoreManagerUser) {
 var mallManagerEmail = req.user.email;
 User.findOne({email:mallManagerEmail}).exec(function(err, mall_manager_user){
 if (err) throw err;
 var mallStoresManagerUsers = mall_manager_user._doc.mall_stores_manager_users;
 mallStoresManagerUsers.push(newStoreManagerUser);
 console.log('Store Manager was connected to Mall manager!');
 mall_manager_user.save();
 });
 }*/
