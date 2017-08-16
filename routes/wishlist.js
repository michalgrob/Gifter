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

router.get('/myEvents', function(req, res, next){
    User.findById(req.user.id).populate('myEvents').exec(function(err,client) {
        var clientEvent =  parseClientEventToJson(client._doc.myEvents);
        res.render('wishlistMyEventsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 ,events : clientEvent } );// req.flash('loginMessage')//

    });
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

function parseClientEventToJson(events,res) {
    var parsedArry = [];
    for (var i = 0; i < events.length; i++) {
        var guests = populateGuests(events[i]._doc._id,res)//eventGuestsUsers);
        var gifts = populateGifts(events[i]._doc._id);
        ///how to wait till mongoose is done
        parsedArry.push({
            id: events[i]._doc._id,
            title: events[i]._doc.title,
            description: events[i]._doc.description,
            event_date: events[i]._doc.event_date,
            gifts: gifts,
            guests: guests

        })
    }
    return parsedArry;
}

function populateGuests(eventId,res) {
    var resultArray = [];

    Event.findById(eventId).populate('eventGuestsUsers').exec(function(err,event) {
        var eventGuestsUsers =  event._doc.eventGuestsUsers;
        for(var j=0; j<eventGuestsUsers.length; j++){
            resultArray.push({
                email: eventGuestsUsers[j]._doc.email,
                username: eventGuestsUsers[j]._doc.username,
                id: eventGuestsUsers[j].id
            })
        }


    })

    return resultArray;
}


function populateGifts(eventId,res) {
    var resultArray=[];

    Event.findById(eventId).populate('gifts').exec(function(err,event) {
        var gifts =  event._doc.gifts;
        for(var j=0; j<gifts.length; j++) {
            resultArray.push({
                id: gifts[j].id,
                name: gifts[j]._doc.name,
                price: gifts[j]._doc.price,
                store_name: gifts[j]._doc.store_name,
                ImageUrl: gifts[j]._doc.ImageUrl

            })
        }
    })
    return resultArray;
}