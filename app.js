require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const moment = require('moment');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Comment = require('./models/comment');
const User = require('./models/user');
const seedDB = require('./seeds');

// requiring routes
const commentRoutes = require('./routes/comments');
const campgroundsRoutes = require('./routes/campgrounds');
const indexRoutes = require('./routes/index');
const forgotRoutes = require('./routes/forgot');

// console.log(process.env.DATABASEURL);
mongoose.connect(
    process.env.DATABASEURL,
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/Public'));
app.use(methodOverride('_method'));
app.use(flash());


app.locals.moment = require('moment');
//PASSPORT CONFIG
app.use(require('express-session')({
    secret: 'once again',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// pass to every single template
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.use('/', indexRoutes);
app.use('/', forgotRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});
