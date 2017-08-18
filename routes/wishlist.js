//const SENDGRID_API_KEY = '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';

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
var nodemailer = require('nodemailer');
var nodemailer = require('nodemailer');


router.get('/', function(req, res, next) {
    res.render('wishlistMainPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/myFriendsEvents', function(req, res, next) {
    res.render('wishlistMyFriendsEventsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/myEvents', function(req, res, next){
    findClientEventDetails(req,res);
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
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'sadna.gifter@gmail.com',
            pass: 'sadnagifter12'
        }
    });

    var mailOptions = {
        from: 'sadna.gifter@gmail.com',
        to: 'sapirv@gmail.com',//'sapirv@gmail.com,michalgrob@gmail.com',
        subject: 'אחרון חביב להיום',
        text: 'נסיון אחרון'
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
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
        sendMailsToGuests([],res);//todo
        updateEventInHost(newEvent.id, hostUser,eventGuestsUsers);
    });
}
function updateEventInHost(eventId,hostUser,eventGuestsUsers){

    User.findOne({_id:hostUser},function (err,client) {
        if(err ){ throw err;}
        client.myEvents.push(eventId);
        client.save(function (err, done){
            if(err ){ throw err;}
            console.log("updateEventInHost SUCCCESSFULLY");
            updateEventInGuest(eventId,eventGuestsUsers);
        });
    })
}
function updateEventInGuest(eventId,eventGuestsUsers){

    for(guestUser in eventGuestsUsers){
        User.findOne({_id:eventGuestsUsers[guestUser]},function (err,client) {
            if(err ){ throw err;}
            client.friendsEvents.push(eventId);
            client.save(function (err, done){
                if(err ){ throw err;}
                console.log("updateEventInGuest SUCCCESSFULLY");
            });
        })
    }

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

function findClientEventDetails(req,res) {

    User.findById(req.user.id)
        .populate({
            path: 'myEvents',
            populate: {
                path:'eventGuestsUsers gifts'
            }
        }).exec(function(err,client) {

        var ClientEvents=[];
        var events=client._doc.myEvents;

        for(var i=0;i<events.length;i++) {
            var guests = generateEventGuestToArray(events[i]);
            var gifts=generateEventGiftsToArray(events[i]);


            ClientEvents.push({
                id: events[i].id,
                title: events[i]._doc.title,
                description: events[i]._doc.description,
                event_date: events[i]._doc.event_date,
                gifts: gifts,
                guests: guests
            });
        }
      //  sendMailsToGuests([],res);
        res.render('wishlistMyEventsPage.ejs', {
            LogedInUser: req.user ? req.user.username : 'guest',
            CartQty: req.session.cart ? req.session.cart.totalQty : 0,
            events: ClientEvents,
        });
    });
}

function generateEventGuestToArray(event) {
    var guests = [];
    var eventGuestsUsers = event._doc.eventGuestsUsers;

    for (var j = 0; j < eventGuestsUsers.length; j++) {
        guests.push({
            email: eventGuestsUsers[j]._doc.email,
            username: eventGuestsUsers[j]._doc.username,
            id: eventGuestsUsers[j].id
        });
    }

    return guests;
}

function generateEventGiftsToArray(event) {

    var giftsEvent = event.gifts;
    var gifts=[];

    for (var j = 0; j < giftsEvent.length; j++) {
        gifts.push({
            id: giftsEvent[j].id,
            name: giftsEvent[j]._doc.name,
            price: giftsEvent[j]._doc.price,
            store_name: giftsEvent[j]._doc.store_name,
            ImageUrl: giftsEvent[j]._doc.ImageUrl

        })
    }
    return gifts;
}

