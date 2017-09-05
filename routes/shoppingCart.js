/**
 * Created by michal on 11/08/2017.
 */

var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var Cart = require('./models/cart');
var User = require('./models/User');
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');

router.post('/remove-from-cart/:id',function (req,res,next) {
    removeGiftFromCart(req,res);
});



router.get('/add-to-cart/:id', function(req, res, next) {
    var giftId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    Gift.findById(giftId, function(err,gift){
        if(err){
            return err;
        }
        cart.add(gift,gift.id);
        req.session.cart = cart;
        if (req.user && req.user.role == 'client'){
            var userId =req.user.id;
            var x=9;
            updateUserShoppingCart(userId,giftId,gift,res)
        }else{
            res.redirect('/');
        }
    });
});

router.get('/shopping-cart',function(req,res,next){

    if (req.user && req.user.role == 'client') {
        findUserSoppingCart(req.user.id,req,res);
    }
    else{//guest
        if(!req.session.cart){
            return res.render('shoppingCartPage',{LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 , products: {}});
        }
        var cart = new Cart(req.session.cart);
        var gifts = cart.generateArray();
        req.session.cart = cart;
        console.log(req.session.cart);
        var totPrice = cart.totalPrice;
        res.render('shoppingCartPage',{LogedInUser: req.user ? req.user : '',CartQty: req.session.cart ? req.session.cart.totalQty : 0 , products: gifts,totalPrice: totPrice});

    }
});

function findUserSoppingCart(userId,req,res) {

    User
        .findById(userId)
        .populate({
            path: 'shoppingCart',
            populate:{
                path: 'store'
        }}).exec(function(err,user) {
        var gifts=user._doc.shoppingCart;
        var cart = new Cart({});

        for(var i = 0; i < gifts.length; i++){
            cart.add(gifts[i]._doc,gifts[i].id);
        }

        req.session.cart = cart;
        console.log(req.session.cart);
        var totPrice = cart.totalPrice;
        var totalQty = cart.totalQty;
        var products = cart.generateArray();
        res.render('shoppingCartPage', {
            LogedInUser: req.user ? req.user : '',
            CartQty: totalQty ,
            products: products,
            totalPrice: totPrice
        });
    });
}


function updateUserShoppingCart(userId,giftId,gift,res)
{
    User.findById(userId, function(err,user){
        // user.addGiftToShoppingBag(giftId);
        user.shoppingCart.push(giftId);
        user.save(function (err) {
            if (err) throw err;
            console.log('gift added to shopping bag successfully!');
            // console.log(req.session.cart);
            res.redirect('/');/////TODO CHANGE
        });
    });
}

function removeGiftFromCart(req,res) {
    var giftId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    User.findById(req.user.id).populate('shoppingCart').exec(function(err,user) {
        if(err){
            return err;
        }
        var shoppingCart = user.shoppingCart;
        for(var i=0; i<shoppingCart.length; i++){
            if(shoppingCart[i].id == giftId){
               var gift = shoppingCart[i];
                cart.remove(gift,gift.id);
                user.shoppingCart.splice(i,1);//gift.id);
                break;
            }
        }

        req.session.cart = cart;

        user.save(function (err){

            if(err){throw err;}
            res.send();
        });

    });

}

module.exports = router;