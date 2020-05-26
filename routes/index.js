var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Campground = require('../models/campground');

//root route
router.get('/', function (req, res) {
    res.render('landing');
});

//show the register form
router.get('/register', function (req, res) {
    res.render('register', { page: 'register' });
});

//this route handle the sign up 
router.post('/registerform', function (req, res) {

    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar,
    });
    if (req.body.adminCode === process.env.ADMINCODE) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register", { error: err.message });
        } passport.authenticate('local')(req, res, function () {
            req.flash('Success', 'Successfully Signed Up! Nice to meet you ' + user.username);
            res.redirect('/campgrounds');
        });
    });
});

// show login form
router.get('/login', function (req, res) {
    res.render('login', { page: 'login' });
});


router.post('/loginform', passport.authenticate('local', {
    // this is an object {success and failure}
    successRedirect: '/campgrounds',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: 'Welcome'
}), function (req, res) {

});

// LOGOUT route

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'See you later!');
    res.redirect('/campgrounds');
});


//USERS Public Profile

router.get('/users/:id', function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash('error', 'Something went wrong.');
            res.redirect('/');
        }
        Campground.find().where('author.id').equals(foundUser._id).exec(function (err, campgrounds) {
            if (err) {
                req.flash('error', 'Something went wrong.');
                return res.redirect('/');
            }
            res.render('users/show', { user: foundUser, campgrounds: campgrounds });
        })
    });
});

module.exports = router;