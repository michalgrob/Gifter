var express = require('express');
var engine = require('ejs-mate');
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var passport = require('passport');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);
var LocalStrategy = require('passport-local').Strategy;
var index = require('./routes/index');
var users = require('./routes/users');
var searchingOpt = require('./routes/searchingOpt');
var searchingResult = require('./routes/searchingResult');
var stores = require('./routes/stores');
var shoppingCart = require('./routes/shoppingCart');
var mallManager = require('./routes/mallManager');
var wishlist=require('./routes/wishlist');
var app = express();
app.engine('ejs',engine);

/*var multer = require('multer');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));*/


var router = express.Router();

//Passport Init:
router.use(passport.initialize());
router.use(passport.session()); // persistent login sessions

//connect to DB

var mongoose = require('mongoose');
mongoose.connect('mongodb://michal:123456@ds121212.mlab.com:21212/heroku_whwjpt2s');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', // session secret
    resave: true,
    saveUninitialized: true,
    store: new MongoStore ({mongooseConnection: mongoose.connection}),
    cookie: {maxAge: 180 * 60 * 1000}
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
app.use(function(req,res,next){
    res.locals.session=req.session;
    next();
})
//sapir
app.use(function(req, res, next) {
    res.locals.messages = req.flash();
    next();
});
//sapir
app.use('/', index);
app.use('/users', users);
app.use('/searchingOpt', searchingOpt);
app.use('/searchingResult',searchingResult);
app.use('/stores',stores);
app.use('/shoppingCart',shoppingCart);
app.use('/mallManager',mallManager);
app.use('/wishlist',wishlist);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

require('./config/passport')(passport);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;


fs.readdir(".", function (err, filenames) {
    var i;
    for (i = 0; i < filenames.length; i++) {
        console.log(filenames[i]);
    }
});
//

processId = process.cwd();
console.log(processId);
