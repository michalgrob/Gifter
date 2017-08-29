var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Gift = require('./models/Gift');
var parser = require('json-parser');
var interest=require('./models/interest');
var inGiftInter=require('./models/inGiftInter');
var User=require('./models/User');
var Cart = require('./models/cart');
var passport = require('passport');

router.get('/login', function(req, res, next) {
    res.render('reLogin.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/signup', function(req, res) {
    res.render('signup.ejs', { message:req.flash('signupMessage'),LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0  });//
});

router.get('/profile', isLoggedIn, function(req, res) {
    res.redirect('/');//res.render('profile.ejs', { user: req.user });
});

router.get('/logout', function(req, res) {
    var cart = new Cart({});
    req.logout();
    req.session.cart = cart;
    res.redirect('/');
});

router.post('/signup', passport.authenticate('local-client-signup', {//signup
    successRedirect: '/profile',
    failureRedirect: 'users/signup',
    failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/users/redirect_user_by_role',//'/profile',
    failureRedirect: '/users/login',
    failureFlash: true,
}));

router.get('/redirect_user_by_role', function(req,res) {
    if (req.user) {
        var userRole = req.user.role;
        switch (userRole) {
            case 'mall_manager':
                res.redirect('/mallManager');
                break;

            case 'store_manager':
                res.redirect('/stores');
                break;
                /*                res.render('storeManagerPage', {
                 etitle: "present",
                 LogedInUser: req.user ? req.user.username : 'guest',
                 CartQty: req.session.cart ? req.session.cart.totalQty : 0,
                 available_gifts: ["stam"]
                 });//userName*/
                break;
            case 'client':
                var x=0;
                User
                    .findById(req.user.id)
                    .populate('shoppingCart')
                    .exec(function(err,user) {
                        if (err){
                            console.log(err);
                        }

                        res.render('mainPage', {
                            etitle: "gifter",
                            LogedInUser: req.user ? req.user.username : 'guest',
                            CartQty:  user._doc.shoppingCart.length
                        });
                    });
                break;

            default:
                res.render('mainPage', {
                    etitle: "gifter",
                    LogedInUser: req.user ? req.user.username : 'guest',
                    CartQty: req.session.cart ? req.session.cart.totalQty : 0
                });
                break;
        }
    } else {
        res.render('mainPage', {
            etitle: "gifter",
            LogedInUser: req.user ? req.user.username : 'guest',
            CartQty: req.session.cart ? req.session.cart.totalQty : 0
        });
    }
});



/*    if (req.user.email == "admin")
 res.redirect('/');//('/admin');
 else if (req.user.role == 'storeManager')
 res.redirect('/stores/storeInfo');//res.render('storeInfoPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest' });
 else
 res.redirect('/');*/

// router.get('/logout', function(req, res){
//     req.logout();
//     req.flash('success_msg', 'You are logged out');
//     res.redirect('/users/login');
// });


/* GET users listing. */
router.get('/login1', function(req, res, next) {
    var psw=req.query.psw;
    var uName=req.query.uname;

    //res.render('userLogin');
    res.render('giftsPage',{LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});//, {orders: orders_json,etitle : "present"});
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

        res.render('signUpPage', {orders: orders_json,etitle : "sign Up Page",LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});
        // response.send('giftsPage', {orders: orders_json});
    });
    // res.render('signUpPage');
    // response.render('giftsPage', {orders: orders_json,etitle : "present"});
});

// router.post('/signUpUser', function(req, res, next) {
//
//
//     var newUser;
//     newUser = new User();
//     newUser.name= req.body.name;
//     newUser.username= req.body.username;
//     newUser.password= req.body.password;
//     newUser.admin= false;
//     newUser.age=req.body.age;
//     newUser.email=req.body.email;
//     newUser.interests=req.body.hobbies;
//     newUser.gender=req.body.gender;
//
//
// // save the user
// newUser.save(function(err) {
//     if (err) throw err;
//
//    console.log('User created!');
//     res.render('mainPage', {etitle : "present",LogedInUser: req.body.username});
// });
//
//     // response.send('giftsPage', {orders: orders_json});
//     //res.render('signUpPage');//, {orders: orders_json,etitle : "sign Up Page"});
//     // res.render('signUpPage');
//     // response.render('giftsPage', {orders: orders_json,etitle : "present"});
// });

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else{
        console.log('User not authenticated. Redirect to home');
        res.redirect('/');

    }
}



