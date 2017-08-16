const SENDGRID_API_KEY = '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';

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
var Event=require('./models/Event');
var StoreManager=require('./models/StoreManager');
var fs = require('fs');
var csv = require('fast-csv');
var passport = require('passport');
var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY)

router.get('/', function(req, res, next) {
    res.render('wishlistMainPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/myFriendsEvents', function(req, res, next) {
    res.render('wishlistMyEventsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/myEvents', function(req, res, next) {
    res.render('wishlistMyEventsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/createEvent', function(req, res, next) {
    res.render('wishlistCreateEvent.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/checkIfGuestIsRegister/:guestMail',function (req,res,next) {
    var guestMail = req.params.guestMail;
    checkIfGuestIsRegister(guestMail,res);
});

router.post('/addEvent',function (req,res,next) {
    createNewEvent(req,res);
});

module.exports = router;

function createGuestsIdsArray(guests) {
    var array=[];

    for(var i=0;i<guests.length;i++){
        array.push(guests[i].id);
    }
    return array;
}
function createGuestsMailsArray(guests) {
    var array=[];

    for(var i=0;i<guests.length;i++){
        array.push(guests[i].email);
    }
    return array;
}
function sendMailsToGuests(guestsMailsArray,res) {//todo check after sendgrid approved

    sendgrid.send({
        to: 'sapirv@gmail.com',
        from: 'michalgrob@gmail.com',
        subject: 'hiii',
        text: 'firstEmail'
    },function (err,json) {
        if(err)
            console.log(err);
        console.log(json);
        res.send("succes");
    });

}
function createNewEvent(req,res) {//todo check gifts array

    var guests = JSON.parse(req.body.guests);
    var title=req.body.eventTitle;
    var description = req.body.eventDescription;
    var gifts = createGuestsIdsArray(JSON.parse(req.body.gifts));
    var hostUser = req.user.id;
    var eventGuestsUsers = createGuestsIdsArray(guests);
    var guestsMailsArray=createGuestsMailsArray(guests);
    var event_date = req.body.eventDate;
    //sendMailsToGuests(guestsMailsArray,res);//todo

//Create new Event:
    var newEvent = new Event({
        title: title,
        description: description,
        gifts: gifts,
        hostUser: hostUser,
        eventGuestsUsers: eventGuestsUsers,
        event_date: event_date
    });
    newEvent.save(function (err, done) {
        if (err) throw err;
        console.log('Event saved successfully!');

    });
}
function checkIfGuestIsRegister(guestMail,res){

    User.findOne({email: guestMail},function (err,user) {
        if(err || user == null){
            res.send("0");
        }
        else {
            res.send(user.id);
        }
    })
}