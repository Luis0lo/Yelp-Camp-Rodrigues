var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');
var multer = require('multer');
var cloudinary = require('cloudinary').v2;

//////////////////////////////////// to upload files(img) - multer config
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

//////////////////////////////////// to upload files(img) - cloudinary config

cloudinary.config({
    cloud_name: 'luis0lo',
    api_key: process.env.API_KEY_CLOUDINARY,
    api_secret: process.env.API_SECRET_CLOUDINARY
});

// INDEX ROUTE - SHOW ALL CAMPGROUNDS
router.get('/', function (req, res) {
    // get all the campgrounds from DB 
    Campground.find({}, function (err, allCampgrounds) {
        if (err) {
            console.log('sorry');
            console.log(err);
        } else {
            res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds' });
        }
    });
});

// CREATE ROUTE - ADD NEW CAMPGROUNDS TO DB
router.post('/', middleware.isLoggedIn, upload.single('image'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, {
        width: 1500,
        height: 1000,
        crop: "scale"
    }, function (err, result) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add image's public_id to campground object
        req.body.campground.imageId = result.public_id;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        Campground.create(req.body.campground, function (err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/campgrounds/' + campground.id);
        });
    });
});

//NEW ROUTE - SHOW FORM TO CREATE NEW CAMPGROUND
// here is the form to make new data
router.get('/new', middleware.isLoggedIn, function (req, res) {
    res.render('campgrounds/new');
});

//SHOW ROUTE - SHOW MORE INFO ABOUT 1 CAMPGROUND
router.get('/:id', function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found');
            res.redirect('back');
        } else {
            console.log(foundCampground);
            //render show template with that campground
            res.render('campgrounds/show', { campground: foundCampground });
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render('campgrounds/edit', { campground: foundCampground });
    });
});
// UPDATE CAMPGROUND ROUTE
router.put('/:id', upload.single("image"), middleware.checkCampgroundOwnership, function (req, res) {

    // find and update the correct campground 
    Campground.findById(req.params.id, async function (err, campground) {
        if (err) {
            req.flash('error', err.message);
            res.redirect('back');
        } else {
            if (req.file) {
                try {
                    await cloudinary.uploader.destroy(campground.imageId);
                    let result = await cloudinary.uploader.upload(req.file.path, {
                        width: 1500,
                        height: 1000,
                        crop: "scale"
                    });
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
            }
            campground.name = req.body.campground.name;
            campground.price = req.body.campground.price;
            campground.description = req.body.campground.description;
            campground.save();
            req.flash('success', 'Successfully Updated');
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, async function (err, campground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try {
            await cloudinary.uploader.destroy(campground.imageId);
            campground.remove();
            res.redirect("/campgrounds");
        } catch (err) {
            if (err) {
                req.flash("error", err.message);
                return res.render("error");
            }
        }
    });
});

module.exports = router;