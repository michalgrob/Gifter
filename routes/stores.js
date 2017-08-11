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
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');


//michal 17/7/17/stores/showStoreGifts
router.post('/showStoreGifts', function(req,res,next){
    getAllStoreGifts(req.user.name,req, res)

});

router.get('/storeManager-sign-up', function (req, res, next) {
    res.render('storeSignUp.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
});

// process the signup form//stores/storeManagerSignUp
router.post('/storeManagerSignUp', passport.authenticate('local-storeManager-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/storeManager-sign-up', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));


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

        res.render('storeDeleteGiftPage', {gifts: giftsTotalScore,etitle: "delete gift",LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});

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

        res.render('storeAddGiftPage', {orders: orders_json, etitle: "add gift ", LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });


    });
});

router.post('/addGift', function(req, res, next) {


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

});
router.get('/storeInfo', function(req, res, next) {

    //getAllStoreGifts(req.user.name,req, res)

    res.render('storeInfoPage', {LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 });

});

router.post('/importCSV', function(req, res, next) {
    var path = req.body.path;
    var store_name = req.body.store_name.toLowerCase();;
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
                addOneGiftToStore(giftName,store_name,minAge,maxAge,gender,price,storeInterests,prodId,store_id,imgURL,next)
            }
        });

    res.render('mainPage', {etitle : "present",LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});
});

module.exports = router;

function addNewStore(storeName,location,gifts,password){

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
            newStore.password = newStore.generateHash(password);

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

function addOneGiftToStore(giftName,storeName,minAge,maxAge,gender,price,storeInterests,prodId,store_id,imgURL,next) {

    interest.find({},function (err,interests) {
        if(err) throw err;
        var newGift = new Gift();
        newGift.name = giftName;
        newGift.prod_id = prodId;
        newGift.price = price;
        newGift.gender = gender;
        newGift.store_id = store_id;
        newGift.store_name = storeName;
        newGift.minAge= minAge;
        newGift.maxAge=maxAge;
        newGift.ImageUrl=imgURL;
        /////////////////
        for(var i=0;i<storeInterests.length;i++)
        {

          //  if(interest.name==storeInterests[i])
           // {
           //     isfound=true;
                newGift.interests.push({interest: storeInterests[i], dynamicScore: 1});
            //    break;
          //  }
        }
        //////////////

        interests.forEach(function (interest) {
                var isfound=false;
            for(var i=0;i<storeInterests.length;i++)
            {

                if(interest.name==storeInterests[i])
                {
                    isfound=true;
                    newGift.interests.push({interest: interest.name, dynamicScore: 1});
                    break;
                }
            }
            if(!isfound)
            {

                newGift.interests.push({interest: interest.name, dynamicScore: 0});

            }
        })

        newGift.save(function(err) {
            if (err) throw err;

            console.log('Gift saved successfully!');
            var giftMongoId=newGift._id;
            relateGiftToStore(giftMongoId,store_id,storeName,next);
        });


    })
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

function relateGiftToStore(newGiftId,store_id,storeName,next) {
    Store.findOneAndUpdate({name: {$in:storeName}},{$push:{gifts:newGiftId}},{new:true},function (err,store) {
        if(err ){ throw err;}

        next();

    })
}
function deleteGiftFromGiftCollection(giftId,giftName) {
    Gift.find({_id: giftId}).remove().exec(function (err, data) {
        if (err) {
            throw err;
        }


    });
}
function deleteGiftFromStoreCollection(giftId,giftName)
{

    Store.findOneAndUpdate({name: {$in:"zara"}},{$pull:{gifts:giftId}},function (err,store) {
        if(err ){ throw err;}

        //next();

    });
}


function getAllStoreGifts(storeName,req, res){
    Gift.find({ store_name: storeName},function(err,gifts){
        if (err) {
            throw err;
        }
        var storeGifts=[];
        for(var i=0;i<gifts.length;i++){
            storeGifts.push({name:gifts[i]._doc.name, id: gifts[i]._doc._id,storeName: gifts[i]._doc.store_name,price: gifts[i]._doc.price,ImageUrl:gifts[i]._doc.ImageUrl});
        }
        res.render('storeGiftsPage.ejs',{LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0,gifts: storeGifts});//('storeGiftsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest'});//gifts: gifts,etitle:req.user.username ,
    })

}
