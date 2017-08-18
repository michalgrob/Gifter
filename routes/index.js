var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var passport = require('passport');

////////////////////////////////////////////////////////////
var bodyParser = require('body-parser');
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
//router.use(express.json());
//////////////////////////////////////////


/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect("/users/redirect_user_by_role");
    //res.render('mainPage', {etitle : "present", LogedInUser: req.user ? req.user.username : 'guest', CartQty: req.session.cart ? req.session.cart.totalQty : 0 });//userName
});


/* GET home page. */
router.post('/', function(req, res, next) {

    console.log('added');
    ///////////////////////////////
    var lname = req.body.lname,
        fname = req.body.fname;
    ////////////////////////////////////
    //  insertdb(lname,fname);
    res.send('POST to Hello World!');

    res.render('index', {etitle : "present",CartQty: req.session.cart ? req.session.cart.totalQty : 0 });
});
router.get('/profile', isLoggedIn, function(req, res) {
    res.redirect('/');//res.render('profile.ejs', { user: req.user });
});

//////////////////////////////////////////////////try
var bodyParser = require('body-parser')
router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));




module.exports = router;






function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

