/**
 * Created by michal on 11/08/2017.
 */

var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
//var interest=require('./models/interest');
//var inGiftInter=require('./models/inGiftInter');
//var User=require('./models/User');
//var Store=require('./models/Store');
var Cart = require('./models/cart');
var User = require('./models/User');
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');

router.get('/add-to-cart/:id', function(req, res, next) {
    var giftId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    Gift.findById(giftId, function(err,gift){
        if(err){
            return err;
        }
        cart.add(gift,gift.id);
        req.session.cart = cart;
        if (req.user.role == 'client'){
            var userId =req.user.id;
            var x=9;
            updateUserShoppingCart(userId,giftId,res)

        }

    });
});

router.get('/shopping-cart',function(req,res,next){

    if(!req.session.cart){
        return res.render('shoppingCartPage',{LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 , products: null});
    }
    if (req.user.role == 'client') {
        findUserSoppingCart(req.user.id);
    }
});
function findUserSoppingCart(userId) {
    User.findById(userId, function(err,user){
        var gifts=user.shoppingCart;
        var cart = new Cart(req.session.cart);
         //var gifts = cart.generateArray();
        req.session.cart = cart;
        console.log(req.session.cart);
        var totPrice = cart.totalPrice;

        res.render('shoppingCartPage', {
            LogedInUser: req.user ? req.user.username : 'guest',
            CartQty: req.session.cart ? req.session.cart.totalQty : 0,
            products: gifts,
            totalPrice: totPrice
        });
    });

}
function updateUserShoppingCart(userId,giftId,res)
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
module.exports = router;