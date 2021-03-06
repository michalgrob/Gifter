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
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');
var availableGifts = new Array();
var availableInterests = new Array();
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


var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'gifter-mta',
    api_key: '295691767823962',
    api_secret: 'oQi03-LFvbNzwueYMUDR8pizdR8'
});

// Get/Post Requests:
router.get('/', function(req, res, next) {
    getGifts(req, function () {
        getAvailableInterests(function () {
            res.render('storeManagerPage', {
                etitle: "present",
                LogedInUser: req.user ? req.user : '',
                CartQty: req.session.cart ? req.session.cart.totalQty : 0,
                available_gifts: availableGifts,
                available_interests: availableInterests
            });
        });
    });
});

function getGifts(req,done){
    var currStoreManager = req.user.email;
    availableGifts = [];
    var iterations = 0;
    User.findOne({email:currStoreManager})
        .populate('store.gifts')
        .exec(function(err, store_manager_user) {
            if (err) throw err;
            var store = store_manager_user.store;
            Store.findOne(store)
                .populate('gifts')
                .exec(function (err, store) {
                    var gifts = store.gifts;
                    for (var i = 0; i < gifts.length; i++) {
                        availableGifts.push(gifts[i]);
                    }
                    done();
                })
        });
}

function getAvailableInterests(done) {
    availableInterests = [];
    interest.find({}).exec(function(err, interests) {
        interests.forEach(function(inter) {
            availableInterests.push(inter.name);
        });
        done();
    });
}

router.post('/importCSV',upload.single('csv_file'),function(req, res, next) {
    req.body.csvFilePath = '../gifter/public/upload/temp/' + req.file.originalname;
    importGiftsFromCSV(req);
});

function importGiftsFromCSV(req) {
    var currStore = req.user.store;
    var csvFilePath = req.body.csvFilePath;
    //Get Store Data (ID, Name):
    Store.findOne(currStore).exec(function (err, store) {
        if (err) throw err;
        readDataFromCSVfileAndInsertToDB(store,csvFilePath);
    });
}

function readDataFromCSVfileAndInsertToDB(store, csvFilePath) {

    //Store Data:
    var store_name = store.name;

    var csvData = [];
    var stream = fs.createReadStream(csvFilePath,{
        flags: 'r',
        encoding: 'utf8'
    })
        .pipe(utf8())
        .pipe(csv());

    stream.on('data',function (data) {
        csvData.push(data);
    });

    stream.on('end',function () {
        for (i = 1; i < csvData.length; i++) {
            var prodId = csvData[i][0];
            var giftName = csvData[i][1];
            var minAge = csvData[i][2];
            var maxAge = csvData[i][3];
            var gender = csvData[i][4];
            var price = csvData[i][5];
            var imgURL = csvData[i][6];
            var storeInterests = csvData[i][7].toLowerCase().split(";");
            addOneGiftToStore(giftName,store_name,minAge,maxAge,gender,price,storeInterests,prodId,store,imgURL);
        }
        deleteFolderRecursive('../gifter/public/upload/temp/');
    });
}

router.post('/addNewGift', function(req, res, next) {
    addNewGift(req, function () {
            res.redirect('/');
        }
    );
});

function addNewGift(req, next) {
    var giftId = req.body.gift_id;
    var giftName = req.body.gift_name;
    var minAge = req.body.min_age;
    var maxAge = req.body.max_age;
    var gender = req.body.gender;
    var price = req.body.price;
    var imgUrl = req.body.gift_img_url;
    var selected_interests = (req.body.selected_interests).split(',');

    var currStore = req.user.store;

    //Get Store Data (ID, Name):
    Store.findOne(currStore).exec(function (err, store) {
        if (err) throw err;

        //Store Data:
        var storeId = store.store_id;
        var storeName = store.name;

        addOneGiftToStore(giftName,
            storeName,
            minAge,
            maxAge,
            gender,
            price,
            selected_interests,
            giftId,
            store,
            imgUrl,
            function(){
                next();
            });
    });
}


function addOneGiftToStore(giftName,storeName,minAge,maxAge,gender,price,storeInterests,prodId,store,imgURL,next) {

    var store_id =store.store_id;

    // Make sure all interests are lower case:
    for(var i=0;i<storeInterests.length;i++) {
        storeInterests[i] = storeInterests[i].toLowerCase();
    }

    //If the gift doesn't exist in DB - Save it into the DB:
    Gift.findOne({name:giftName},(function(err,gift){
        if (err) throw err;

        //Check if the gift exists:
        if (gift) {
            console.log('The Gift: ' + giftName + ' already exists!!!');
        }else {

            //Upload Image to cloudnery:
            cloudinary.uploader.upload(imgURL, function(result,err) {
                if(err) throw err;
                imgURL = result.url;

                //Create gift object:
                var newGift = new Gift();
                newGift.name = giftName;
                newGift.prod_id = prodId;
                newGift.price = price;
                newGift.gender = gender;
                newGift.store = store;
                newGift.store_name = storeName;
                newGift.minAge = minAge;
                newGift.maxAge = maxAge;
                newGift.ImageUrl = imgURL;

                //Add all intrests to the gift:
                // gift intrests: score: 1
                // non gift intrests: score: 0

                interest.find({},function (err,interests) {
                    if(err) throw err;

                    var interestsWithScore1 = interests.filter(function (element) {
                            for (var i = 0; i < storeInterests.length; i++) {
                                if (element.name == storeInterests[i]) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    );

                    var interestsWithScore0 = interests.filter(function(e){return this.indexOf(e)<0;},interestsWithScore1);

                    interestsWithScore1.forEach(function (interest){
                        newGift.interests.push({interest: interest.name, dynamicScore: 1,interestRef: interest});
                    });

                    interestsWithScore0.forEach(function (interest){
                        newGift.interests.push({interest: interest.name, dynamicScore: 0,interestRef: interest});
                    });

                    newGift.save(function(err) {
                        if (err) throw err;

                        console.log('Gift saved successfully!');
                        var giftMongoId=newGift._id;
                        relateGiftToStore(giftMongoId,store_id,storeName,next);
                    });
                })
            });
        }
    }));
}

function relateGiftToStore(newGiftId,store_id,storeName,next) {
    Store.findOneAndUpdate({name: {$in:storeName}},{$push:{gifts:newGiftId}},{new:true},function (err,store) {
        if(err ){ throw err;}
        if(next != null){
            next();
        }
    })
}


router.post('/deleteGift', function(req,res,next){
    deleteGift(req,function () {
        sleep(1000);
        res.redirect("/users/redirect_user_by_role");
    });
});

function deleteGift(req,done) {
    var currGiftID = req.body.gift_id;
    var currStore = req.user.store;

    var storeObject, giftObject;

    //Delete Gift from DB:
    //1. Search Store in the DB:
    Store.findOne(currStore)
        .populate('gifts')
        .exec(function (err, store) {
            if (err) throw err;
            storeObject = store;

            giftObject = store.gifts.find(function (element) {
                return element.prod_id == currGiftID;
            });
            var giftMongodbID = giftObject._id;

            //2. Search Gift in the DB:
            Gift.findOne({_id: giftMongodbID})
                .populate()
                .exec(function (err, gift){
                    if (err) throw err;
                    giftObject = gift;

                    //3.Disconnect Gift from Store:
                    var storeGiftsContainer = storeObject.gifts;
                    storeGiftsContainer.pull(giftObject);
                    storeObject.save();

                    //4. Delete select Gift from DB:
                    Gift.findOneAndRemove({_id: giftMongodbID}, function (err) {
                        if (err)  throw err;
                        done();
                    });
                });
        });
}


router.post('/editGift', function(req, res, next) {
    editGift(req, function () {
            res.redirect('/');
        }
    );
});

function editGift(req, next) {
    var giftId = req.body.gift_id;
    var giftName = req.body.gift_name;
    var minAge = req.body.min_age;
    var maxAge = req.body.max_age;
    var gender = req.body.gender;
    var price = req.body.price;
    var imgUrl = req.body.gift_img_url;
    var selected_interests = (req.body.selected_interests).split(',');

    var currStore = req.user.store;

    //Get Store Data (ID, Name):
    Store.findOne(currStore)
        .populate('gifts')
        .exec(function (err, store) {
            if (err) throw err;
            store;

            var giftObject = store.gifts.find(function (element) {
                return element.prod_id == giftId;
            });

            var giftMongodbID = giftObject._id;

            //Update the gift data:
            Gift.findOne(giftMongodbID,function (err,foundGift) {
                if(err) throw err;

                //Upload gift to cloudinary if needed:

                if(imgUrl.includes('cloudinary.com/gifter-mta') == false){
                    cloudinary.uploader.upload(imgUrl, function(result,err) {
                        if (err) throw err;
                        imgUrl = result.url;

                        //Update founded Gift:
                        foundGift.name = giftName;
                        foundGift.minAge = minAge;
                        foundGift.maxAge = maxAge;
                        foundGift.gender = gender;
                        foundGift.price = price;
                        foundGift.ImageUrl = imgUrl;

                        for(var i=0; i<foundGift.interests.length; i ++){
                            var interest = foundGift.interests[i];
                            if(interest.dynamicScore >= 1){
                                if(selected_interests.includes(interest.interest) == false){
                                    interest.dynamicScore = 0;
                                }
                            }else{
                                if(selected_interests.includes(interest.interest)){
                                    interest.dynamicScore = 1;
                                }else{
                                    interest.dynamicScore = 0;
                                }
                            }
                        }

                        foundGift.markModified('interests');
                        foundGift.save();

                        next();

                    });
                }else{

                    //Update founded Gift:
                    foundGift.name = giftName;
                    foundGift.minAge = minAge;
                    foundGift.maxAge = maxAge;
                    foundGift.gender = gender;
                    foundGift.price = price;
                    foundGift.ImageUrl = imgUrl;

                    for(var i=0; i<foundGift.interests.length; i ++){
                        var interest = foundGift.interests[i];
                        if(interest.dynamicScore >= 1){
                            if(selected_interests.includes(interest.interest) == false){
                                interest.dynamicScore = 0;
                            }
                        }else{
                            if(selected_interests.includes(interest.interest)){
                                interest.dynamicScore = 1;
                            }else{
                                interest.dynamicScore = 0;
                            }
                        }
                    }

                    foundGift.markModified('interests');
                    foundGift.save();

                    next();

                }
            });
        });
}

//------------------------------------------------Utils-----------------------------------------------------------------------------

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

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}



//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/*router.post('/addGift', function(req, res, next) {


    var minAge=req.body.minAge;
    var maxAge=req.body.maxAge;
    var gender=req.body.gender;
    var price=req.body.price;
    var storeName=req.body.storeName;
    var storeInterests=["Travel","Readind","Cooking","Fashion"];//["Sports & Outdoors-Travel"];//req.body.hobbies;
    var  giftName=req.body.giftName;
    var  giftId =req.body.giftId;
    var storeId=req.body.storeId;
    //
    addOneGiftToStore(giftName,storeName,minAge,maxAge,gender,price,storeInterests,giftId,storeId,"https://steim.amazingcdn.space/catalog/product/cache/1/image/300x/9df78eab33525d08d6e5fb8d27136e95/1/0/108409063.jpg",function(){
        res.redirect('/stores/storeInfo');});

    // giftSearch(gender,maxPrice ,minPrice,age, req.body.hobbies,res);
    // res.render('resultPage');

});*/


module.exports = router;


//michal 17/7/17/stores/showStoreGifts
router.post('/showStoreGifts', function(req,res,next){
    getAllStoreGifts(req.user.name,req, res)
});

router.get('/storeManager-sign-up', function (req, res, next) {
    res.render('storeSignUp.ejs', { LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
});

// process the signup form/stores/storeManagerSignUp
router.post('/storeManagerSignUp', passport.authenticate('local-storeManager-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/storeManager-sign-up', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

router.get('/storeInfo', function(req, res, next) {
    //getAllStoreGifts(req.user.name,req, res)
    res.render('storeInfoPage', {LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
});

router.post('/createNewStore', function(req,res,next){
    createNewStore(req);
});

router.get('/storeDeleteGift', function(req, res, next) {
    var storeName="zara";//

    Gift.find({store_name:storeName}).populate('interests').exec(function(err,gifts) {

        var giftsTotalScore=[];
        for(var i=0;i<gifts.length;i++)// interest for
        {
            // var currTotal=0;
            giftsTotalScore.push({name:gifts[i]._doc.name, id: gifts[i]._doc._id,storeName: gifts[i]._doc.store_name,
                price: gifts[i]._doc.price,ImageUrl:gifts[i]._doc.ImageUrl});
        }

        res.render('storeDeleteGiftPage', {gifts: giftsTotalScore,etitle: "delete gift",LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0});

    });

    var x = 0;

});
router.post('/DelGift', function(req, res, next) {

    // var searchInterests = req.query.searchInterest.split(',');
    var giftName=req.query.giftName;
    var giftId=req.query.giftId;
    deleteGiftFromStoreCollection(giftId,giftName);
    deleteGiftFromGiftCollection(giftId,giftName);
    //req.flash('gift Deleted');
    req.flash("messages", { "success" : "Gift Deleted Success" });//sapir
    res.redirect('/stores/storeDeleteGift');



    var x=8;

});
router.get('/storeAddGift', function(req, res, next) {
    var x = 0;
    //  var uName=req.query.sname;
    interest.find({}, function (err, orders) {
        if (err) throw err;
        var orders_json = [];
        orders.forEach(function (order) {
            orders_json.push({interest: order.name});
        });
        res.render('storeAddGiftPage', {orders: orders_json, etitle: "add gift ", LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
    });
});

function addNewStore1(storeName,location,gifts){

    Store.find({name:storeName,location:location},(function(err,stores) {
        if (err) throw err;
        if (stores.length) {
            console.log('Store exiss!!!');
           // alert("the store id is already exist");
        }
        else {

            var newStore = new Store();
            newStore.name = storeName;
            newStore.store_id = stores.length;
            newStore.location = location;
            //newStore.password = newStore.generateHash(password);

            for (var i = 0; i < gifts.length; i++)// interest for
            {
                newStore.gifts.push(gifts[i]._id);
            }
            newStore.save(function (err) {
                if (err) throw err;

                console.log('store saved successfully!');
            });
        }
    }))
}

function deleteGiftFromGiftCollection(giftId,giftName) {
    Gift.find({_id: giftId}).remove().exec(function (err, data) {
        if (err) {
            throw err;
        }
    });
}
function deleteGiftFromStoreCollection(giftId,giftName){
    Store.findOneAndUpdate({name: {$in:"zara"}},{$pull:{gifts:giftId}},function (err,store) {
        if(err ){ throw err;}
        //next();
    });
}

//
function getAllStoreGifts(storeName,req, res){
    Gift.find({ store_name: storeName},function(err,gifts){
        if (err) {
            throw err;
        }
        var storeGifts=[];
        for(var i=0;i<gifts.length;i++){
            storeGifts.push({name:gifts[i]._doc.name, id: gifts[i]._doc._id,storeName: gifts[i]._doc.store_name,price: gifts[i]._doc.price,ImageUrl:gifts[i]._doc.ImageUrl});
        }
        res.render('storeGiftsPage.ejs',{LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0,gifts: storeGifts});//('storeGiftsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest'});//gifts: gifts,etitle:req.user.username ,
    })
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

                //Create Store Manager User:
                var newStoreManagerUser = new StoreManager({
                    email: storeManagerEmail,
                    password: storeManagerPassword,
                    name: storeName,
                    username: storeManagerUserName,
                    store: newStore,
                    admin: true,
                    store_id: storeId
                });

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
                                var mallManagerUser = mall_manager_user;
                                mallManagerUser.mall_stores_manager_users.push(savedStoreManager);
                        });
                    });
                }});
            });
        }
    }));
}

//Leisure	,Sports&Outdoors	,Fashion	,Home&Garden	,Indoor Hobbies	, Life Style

function findInterCategoryNumByName(category) {
    //category=category.trim();
    switch (category.replace(/\s/g, "") )
    {
        case "Leisure":
            return 1;
        case "Sports&Outdoors":
            return 2;
        case "Fashion":
            return 3;
        case"Home&Garden":
            return 4;
        case "IndoorHobbies":
            return 5;
        case "LifeStyle":
            return 6;
    }
}




/*router.post('/importCSV', function(req, res, next) {
 var path = req.body.path;
 var currStore = req.user.store;


 //Get Store Data (ID, Name):
 Store.findOne(currStore).exec(function (err, store) {
 if (err) throw err;
 var store_id = store.store_id;
 var store_name = store.store_name;
 });

 // Read data from CSV file, save it into the DB and connect it to the store.
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
 addOneGiftToStore(giftName,store_name,minAge,maxAge,gender,price,storeInterests,prodId,store_id,imgURL,next)
 }
 sleep(500);
 res.redirect("/users/redirect_user_by_role");
 });
 });*/

    //Validations:
/*    req.checkBody('storeName','The Store Name is required.').notEmpty();
    req.checkBody('storeManagerEmail','The Store Manager Email is required.').notEmpty();
    req.checkBody('storeManagerUserName','The Store Manager Username is required.').notEmpty();
    req.checkBody('storeManagerPassword','The Store Password is required.').notEmpty();
    req.checkBody('storeManagerPasswordConfirm','Passwords does not match.').equals(storeManagerPassword);
    req.checkBody('storeId','The Store ID is required.').notEmpty();

    var errors = req.validationErrors();*/

/*    passport.authenticate('local-storeManager-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/storeManager-sign-up', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    });*/

/*    passport.authenticate('create-store-manager', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/storeManager-sign-up', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }, function(req,res,done){*/




// router.post('/login', passport.authenticate('local-login', {
//     successRedirect: '/',//'/profile',
//     failureRedirect: '/stores/login',
//     failureFlash: true,
// }));

// router.get('/login', function(req, res, next) {
//     res.render('storeInfoPage', { LogedInUser: req.store ? req.store.name : 'guest' } );// req.flash('loginMessage')//
// });


// router.get('/login', function(req, res, next) {
//
//     var x=0;
//     var uName=req.query.sname;
//  //   var gifts = [];
//  //   addNewStore("castro","azrieli tlv",gifts);//
//     res.render('storeInfoPage', {etitle : "Stroe Page",LogedInUser:uName});
//
// });



