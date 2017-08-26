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

var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var utf8 = require('to-utf-8');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var path = '../gifter/public/upload/temp/';
        mkdirp(path, function (err) {
            if (err) console.error(err)
            else{
                console.log('folder' + path + ' created succesfully!');
                cb(null,path);
            }
        });
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage });


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

    // Get request parameters:
    var mallManagerEmail = req.user.email;
    var storeId = req.body.store_id;
    var storeName = req.body.store_name;
    var storeLocation = req.body.store_location;
    var storeManagerUserName = req.body.store_manager_username;
    var storeManagerEmail = req.body.store_manager_email;
    var storeManagerPassword = req.body.store_manager_password;

    // Create new store:
    createSingleStore(mallManagerEmail,storeId,storeName,storeLocation,storeManagerUserName,storeManagerEmail,storeManagerPassword);

    sleep(1000);
    res.redirect("/users/redirect_user_by_role");
});

router.post('/createMallManager', function(req,res,next){
    createMallManager(req);
});

router.post('/importCSV',upload.single('csv_file'),function(req, res, next) {
    req.body.csvFilePath = '../gifter/public/upload/temp/' + req.file.originalname;
    importStoresFromCSV(req, res);
});

function importStoresFromCSV(req,res) {

    var csvFilePath = req.body.csvFilePath;
    var mallManagerEmail = req.user.email;
    var csvData = [];

    //Create Stream:
    var stream = fs.createReadStream(csvFilePath,{
        flags: 'r',
        encoding: 'utf8'
    })
    .pipe(utf8())
        .pipe(csv());

    //Read data from CSV file and store it in 'csvData' parameter:
    stream.on('data',function (data) {
        csvData.push(data);
    });

    //Send the data to createSingleStore function:
    stream.on('end',function () {
        for (i = 1; i < csvData.length; i++) {
            var storeId = csvData[i][0];
            var storeName = csvData[i][1];
            var storeLocation = csvData[i][2];
            var storeManagerUserName = csvData[i][3];
            var storeManagerEmail = csvData[i][4];
            var storeManagerPassword = csvData[i][5];
            createSingleStore(mallManagerEmail,storeId,storeName,storeLocation,storeManagerUserName,storeManagerEmail,storeManagerPassword);
        }
        deleteFolderRecursive('../gifter/public/upload/temp/');
        res.redirect("/");
    });
}

function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        if(path != '../gifter/public/upload/temp/')
            fs.rmdirSync(path);
    }
};


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



function createSingleStore(mallManagerEmail,storeId,storeName,storeLocation,storeManagerUserName,storeManagerEmail,storeManagerPassword){

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
            console.log('The Store: ' + newStore.name + ' already exists!!!');
        }else{
            User.findOne({ email:  storeManagerEmail }, function(err1, user) {
                if (err1) throw err;
                if (user) {
                    console.log('User email ' + newStoreManagerUser.name + ' is already in use.!');
                }else{
                    // Save new store:
                    newStore.save(function (err, done) {
                        if (err) throw err;
                        console.log('The Store: ' + newStore.name + ' saved successfully!');
                        connectStoreToMallManager(mallManagerEmail,newStore);

                        // Save new store manager user:
                        newStoreManagerUser.save(function (err){
                            if (err)throw err;
                            console.log('Store Manager User: ' + newStoreManagerUser.name + ' created successfully!');
                        });
                    });
                }
            });
        }
    }));
}

function connectStoreToMallManager(mallManagerEmail, newStore) {
    //var mallManagerEmail = req.user.email;
    User.findOne({email:mallManagerEmail}).exec(function(err, mall_manager_user){
        if (err) throw err;
        var mallManagerStoresArray = mall_manager_user.stores;
        mallManagerStoresArray.push(newStore);
        console.log('The Store: ' + newStore.name + ' was connected to Mall manager!');
        mall_manager_user.save();
    });
}

router.post('/deleteStore', function(req,res,next){
    deleteStore(req,function () {
        sleep(500);
        res.redirect("/users/redirect_user_by_role");
    });
});

function deleteStore(req, done) {
    var currMallManagerEmail = req.user.email;
    var storeName = req.body.store_name;

    var storeObject,storeManagerUser;

    //---------Delete Store from DB-----------

    //1. Search in the DB:
    Store.findOne({name: storeName})
        .populate('gifts')
        .exec(function (err, store) {
            if (err) throw err;

            storeObject = store;
            storeManagerUser = store.store_manager_user;


            //2. Delete all stores gifts:
            deleteAllStoresGifts(storeObject);

            //3. Delete Store Manager User:
            User.findOne(storeManagerUser,function (err,user) {
                var storeManagerEmail = user.email;
                User.findOneAndRemove({email: storeManagerEmail}, function (err) {
                    if (err)  throw err;
                    console.log("The store manager of the store: " + storeName + " was successfully deleted!");
                });
            });

            //4.Disconnect Store Manager from the Mall Manager:
            User.findOne({email: currMallManagerEmail})
                .populate('stores')
                .exec(function (err, mallManager) {
                    if (err)  throw err;
                    mallManager.stores.pull(storeObject);
                    mallManager.save();

                    //5. Delete Store:
                    Store.findOneAndRemove({name: storeName}, function (err) {
                        if (err)  throw err;
                        console.log("The store: " + storeName + " was successfully deleted!");
                        done();
                    });

                });
        });
}

function deleteAllStoresGifts(store,done) {
    var storeGifts = store.gifts;

    for (var i = 0; i < storeGifts.length; i++) {
        var giftName = storeGifts[i].name;
        Gift.findOneAndRemove({_id: storeGifts[i]._id}, function (err) {
            if (err)  throw err;
            console.log("The gift: " + giftName + " was successfully deleted!");
        });
    }
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
