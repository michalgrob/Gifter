/**
 * Created by michal on 09/05/2017.
 */
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
var inGiftInter=require('./models/inGiftInter');
//mongoose.connect('mongodb://localhost/test');


router.post('/IncScore', function(req, res, next) {

    var searchInterests = req.query.searchInterest.split(',');
    var giftName=req.query.giftName;
    var giftId=req.query.giftId;
    //req.user.gift_bag.push(giftId);

    updateDynamicScoreOfGiftInterest(giftId,giftName,searchInterests,res);
    //res.redirect("shoppingCart/add-to-cart/"+giftId)

});

router.post('/', function(req, res, next) {
//todo change render to next fucntion! michal sapir

    var age=req.body.age;
    var gender=req.body.gender;
    var minPrice=req.body.minPrice;
    var maxPrice = req.body.maxPrice;
    var fromFunction=1;
    var hobbies = [];

    if(typeof req.body.hobbies === 'string'){
        hobbies.push(req.body.hobbies);
    }else{

        req.body.hobbies.forEach(function (element) {
            hobbies.push(element);
        })
    }

    giftSearch(gender,maxPrice ,minPrice,age,hobbies,res,req,fromFunction);
    // res.render('resultPage');

});

router.post('/giftSearchByClient', function(req, res, next) {
//todo change render to next fucntion! michal sapir

    var age=req.user.age;
    var gender=req.user.gender;
    var minPrice=0;
    var maxPrice = 8000;
    var hobbies=req.user.interests;
    var fromFunction=2;

    giftSearch(gender,maxPrice ,minPrice,age,hobbies,res,req,fromFunction);
    // res.render('resultPage');

});


module.exports = router;




function giftSearch(gender,maxPrice ,minPrice,userAge, userInterests ,res,req,fromFunction) {

    Gift.find({}).populate({ path:'interests store'}).exec(function(err,gifts) {

        var giftsTotalScore=[];
        for(var i=0;i<gifts.length;i++)// interest for
        {
            var currTotal=0;
            for(var j=0;j< gifts[i]._doc.interests.length;j++)
            {
                if(isContaineInterest(gifts[i]._doc.interests[j].interest,userInterests))
                {
                    currTotal+=gifts[i]._doc.interests[j].dynamicScore;
                }
            }

            if(!isPriceMatches(gifts[i]._doc.price,maxPrice,minPrice))
            {
                continue;
            }
            currTotal=ageMatches(gifts[i]._doc.minAge,gifts[i]._doc.maxAge,userAge,currTotal);
            currTotal=genderMatches(gender,gifts[i]._doc.gender,currTotal);
            //mall promotions
           if(gifts[i].store.is_promoted){
               currTotal = currTotal * 1.25;
           }
            giftsTotalScore.push({name:gifts[i]._doc.name, id: gifts[i]._doc._id,storeName: gifts[i]._doc.store_name,price: gifts[i]._doc.price,ImageUrl:gifts[i]._doc.ImageUrl,tot: currTotal});
        }

        giftsTotalScore.sort(function (b,a){return a.tot-b.tot });
        giftsTotalScore.slice(0,51);
        if (fromFunction==1) {
            res.render('resultPage', {
                gifts: giftsTotalScore,
                searchInterest: userInterests,
                LogedInUser: req.user ? req.user : '',
                CartQty: req.session.cart ? req.session.cart.totalQty : 0
            });
        }
        else{
            res.send( (JSON.parse(JSON.stringify(giftsTotalScore))));

        }

    });
}
function ageMatches(minAge,maxAge,userAge,totalScore)
{
    if(userAge<=maxAge&&userAge>=minAge)
    {
        return (totalScore*1.10);
    }
    else
    {
        var ageDifference=Math.min(Math.abs(minAge-userAge),Math.abs(maxAge-userAge));

        if (ageDifference>5&&ageDifference<10)
        {
            return (totalScore*0.95);
        }
        else if(ageDifference>=10)
        {
            return (totalScore*0.75);
        }
        else
        {
            return (totalScore);
        }
    }
}

function isPriceMatches(pPrice,maxPrice,minPrice) {
    if(pPrice<=maxPrice&&pPrice>=minPrice)
    {
        return true
    }
    return false;

}
function isContaineInterest(inter, userInterests) {

    for(var i=0;i<userInterests.length;i++)
    {
        if(inter==userInterests[i])
        {
            return true;
        }
    }
    return false;
}
function genderMatches(userGender,giftGender,totalScore)
{

    if(userGender=="b")
    {
        return totalScore;
    }
    if(userGender==giftGender)
    {
        return (totalScore*1.20);
    }
    else
    {
        return (totalScore*0.75);
    }
}

function updateDynamicScoreOfGiftInterest(giftId,giftName,searchInterests,res)
{
    Gift.findOne({_id: giftId}).populate('interests').exec(function(err,gift) {

        for(var i=0;i<searchInterests.length;i++)
        {
            for(var j=0;j<gift._doc.interests.length;j++)
            {
                if(searchInterests[i]==gift._doc.interests[j].interest)
                {
                    console.log('old ' +gift._doc.interests[j].interest+': ' +gift._doc.interests[j].dynamicScore );
                    var newScore;

                    if(gift._doc.interests[j].dynamicScore==0)
                    {
                        newScore=0.10;
                    }
                    else
                    {
                        newScore=gift._doc.interests[j].dynamicScore*1.10;
                    }

                    gift._doc.interests[j].dynamicScore=newScore;
                    continue;
                }
            }
        }

        var x=2;
        gift.save(function (err) {
            if(err){throw err;}
                //next();
      //      var redirectUrl = '/shoppingCart/add-to-cart/'+giftId.toString();
        //  res.redirect('/shoppingCart/add-to-cart/'+giftId.toString());
            res.redirect('/');/////TODO CHANGE


        });
    });
}
