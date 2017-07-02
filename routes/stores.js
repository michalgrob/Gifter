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

router.get('/login', function(req, res, next) {

    var x=0;
    var uName=req.query.sname;

    res.render('storeInfoPage', {etitle : "Stroe Page",LogedInUser:uName});

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

        res.render('storeAddGiftPage', {orders: orders_json, etitle: "add gift ", LogedInUser: "Guest"});


    });
});

router.post('/addGift', function(req, res, next) {

    var minAge=req.body.minAge;
    var maxAge=req.body.maxAge;
    var gender=req.body.gender;
    var price=req.body.price;
    var storeName=req.body.storeName;
    var storeInterests=req.body.hobbies;
    var  giftName=req.body.giftName;
    var  giftId =req.body.giftId;
    var storeId=req.body.storeId;
    //
    addOneGiftToStore(giftName,storeName,minAge,maxAge,gender,price,storeInterests,giftId,storeId,next," ");
    // giftSearch(gender,maxPrice ,minPrice,age, req.body.hobbies,res);
    // res.render('resultPage');

});



module.exports = router;

function addNewStore(storeName,location,gifts){

    Store.find({}).exec(function(err,stores) {

        var newStore = new Store();
        newStore.name=storeName;
        newStore.store_id=stores.length+1;
        newStore.location=location;

        for(var i=0;i<gifts.length;i++)// interest for
        {
            newStore.gifts.push(gifts[i]._id);
        }
        newStore.save(function(err) {
            if (err) throw err;

            console.log('store saved successfully!');
        });
    })
}

function addOneGiftToStore(giftName,storeName,minAge,maxAge,gender,price,storeInterests,prodId,store_id,next,imgURL) {

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

        interests.forEach(function (interest) {
            for(var i=0;i<storeInterests.length;i++)
            {
                if(interest.name==storeInterests[i])
                {
                    newGift.interests.push({interest: interest.name, dynamicScore: 1});
                    break;
                }
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

function relateGiftToStore(newGiftId,store_id,storeName,next) {
    Store.findOneAndUpdate({name: {$in:storeName}},{$push:{gifts:newGiftId}},function (err,store) {
        if(err ){ throw err;}
        
    })
}