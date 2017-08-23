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
var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
var moment = require('moment');
var nodemailer = require('nodemailer');


router.get('/', function(req, res, next) {
    res.render('wishlistMainPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
});

router.get('/myFriendsEvents', function(req, res, next) {
    findFriendsEventDetails(req,res);
    //res.render('wishlistFriendsEventsPage.ejs', { LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0 } );// req.flash('loginMessage')//
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
function sendMailsToGuests(eventId,guests,hostUser,title,event_date,res) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'sadna.gifter@gmail.com',
            pass: 'sadnagifter12'
        }
    });
    for (var i = 0; i < guests.length; i++) {
        var htmlMsg=createHtmlMsg(guests[i],eventId,hostUser,title,event_date);
        var mailOptions = {
            from: '"Gifter"<sadna.gifter@gmail.com>',
            to: guests[i].email,//,michalgrob@gmail.com',
            subject: 'WOW '+hostUser+' invites you to his event!!',
            html: htmlMsg};
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}
function createHtmlMsg(guest,eventId,hostUser,title,event_date)
{
    var date=moment(event_date).format( 'dddd, MMMM Do YYYY, h:mm:ss a');
    var msg='<div class="jumbotron text-xs-center">' +
        '<h1 class="display-3">HELLO '+ guest.username+' !</h1>' +
        '<h5 class="lead">' +
        '<strong>'+hostUser+' invites you to "'+title+'" and create a wishlist.</strong><br> ' +
        'Event id : '+eventId+'<br>' +
        'Event on : '+date+'</h5>'+
        '<hr>' +
        '<h4>Having fun! ' +
        '<a href="">You are more then welcome to get to our site and see more details about '+hostUser+'</a>' +
        '</h4>' +
        '<h5 class="lead">'
    '<a class="btn btn-primary btn-sm" href=https://sadna-gifter.herokuapp.com/wishlist/myEvents+ role="button">Continue to event</a>' +
    '</h5>' +
    '</div>'

    return msg;
}
function createNewEvent(req,res) {//todo check gifts array

    var guests = JSON.parse(req.body.guests);
    var title=req.body.eventTitle;
    var description = req.body.eventDescription;
    var gifts = createGiftsArray(JSON.parse(req.body.gifts));//createGuestsIdsArray(JSON.parse(req.body.gifts));
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
        sendMailsToGuests(newEvent.id,guests,req.user.username,title,event_date,res);//todo
        updateEventInHost(newEvent.id, hostUser,eventGuestsUsers);

        // res.redirect('');


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
            var user={id:user.id,username:user.username};
            res.send(user);
        }
    })
}
function findFriendsEventDetails(req,res) {
    User.findById(req.user.id)
        .populate({
            path: 'friendsEvents',
            populate: {
                path:'hostUser gifts.gift '
            }
        }).exec(function(err,client) {

        var FriendsEvents=[];
        var events=client._doc.friendsEvents;

        for(var i=0;i<events.length;i++) {
            var hosttUser=events[i].hostUser;
            var gifts=generateEventGiftsToArray(events[i]);


            FriendsEvents.push({
                id: events[i].id,
                title: events[i]._doc.title,
                description: events[i]._doc.description,
                event_date: moment(events[i]._doc.event_date).format( 'dddd, MMMM Do YYYY, h:mm:ss a'),
                gifts: gifts,
                host: hosttUser.username
            });
        }
        //  sendMailsToGuests([],res);
        res.render('wishlistFriendsEventsPage.ejs', {
            LogedInUser: req.user ? req.user.username : 'guest',
            CartQty: req.session.cart ? req.session.cart.totalQty : 0,
            events: FriendsEvents,
        });
    });
}


function findClientEventDetails(req,res) {

    User.findById(req.user.id)
        .populate({
            path: 'myEvents',
            populate: {
                path:'eventGuestsUsers gifts.gift gifts.markedBy'
            }
        }).exec(function(err,client) {

        var ClientEvents=[];
        var events = client._doc.myEvents;

        for(var i=0;i<events.length;i++) {
            var guests = generateEventGuestToArray(events[i]);
            var gifts=generateEventGiftsToArray(events[i]);


            ClientEvents.push({
                id: events[i].id,
                title: events[i]._doc.title,
                description: events[i]._doc.description,
                event_date: moment(events[i]._doc.event_date).format( 'dddd, MMMM Do YYYY, h:mm:ss a'),
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
        var markedBy = -1;
        if(giftsEvent[j].markedBy!=null){
            markedBy = giftsEvent[j].markedBy._doc.username;
        }

        gifts.push({
            id: giftsEvent[j].gift.id,
            name: giftsEvent[j].gift._doc.name,
            price: giftsEvent[j].gift._doc.price,
            store_name: giftsEvent[j].gift._doc.store_name,
            ImageUrl: giftsEvent[j].gift._doc.ImageUrl,
            isMarked: giftsEvent[j].isMarked,
            markedBy: markedBy

        });
    }
    return gifts;
}

function createGiftsArray(gifts) {
    var array=[];

    for(var i=0;i<gifts.length;i++){
        array.push({isMarked: false, markedBy: null,  gift :gifts[i].id});
    }
    return array;
}