var LocalStrategy = require('passport-local').Strategy;
var User=require('./../routes/models/User');
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, email, password, done) {
            process.nextTick(function() {
                User.findOne({ email:  email }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already in use.'));
                    } else {
                        var newUser = new User();
                        newUser.email = email;
                        newUser.password = newUser.generateHash(password);
                        newUser.name= req.body.name;
                        newUser.username= req.body.username;
                     //   newUser.password= req.body.password;
                        newUser.admin= false;
                        newUser.age=req.body.age;
                       // newUser.email=req.body.email;
                        newUser.interests=req.body.hobbies;
                        newUser.gender=req.body.gender;
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, email, password, done) {
            User.findOne({ 'email':  email }, function(err, user) {
                if (err)
                    return done(err);
                if (!user)

                    return done(null, false,req.flash('loginMessage', 'No user found.') );//
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Wrong password.'));//
              // //req.flash('loginMessage', 'No user found.')
              //
              //   if (!user.validPassword(password))
              //       return done(null, false, req.flash('loginMessage', 'Wrong password.'));//req.flash('loginMessage', 'Wrong password.')
                return done(null, user);
            });
        }));
};