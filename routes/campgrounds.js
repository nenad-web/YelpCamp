var express = require("express");
var router = express.Router();
var Campground = require("../models/campgrounds");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 


//INDEX - show all campgrounds
router.get("/", function(req, res){
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Campground.find({name: regex}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            if(allCampgrounds.length < 1) {
                req.flash("error", "Campground not found");
                return res.redirect("back");
        }
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user})
        }
    });
  } else {
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user})
        }
    });
  }
});

//CREATE - add new campgrounds to db 
router.post("/", middleware.isLoggedIn, function(req, res){
   var name = req.body.name;
   var price = req.body.price;
   var image = req.body.image;
   var desc = req.body.description;
   var author = {
       id: req.user._id,
       username: req.user.username
   }
   var newCampground = {name: name, price: price, image: image, description: desc, author: author};
   //Create a new campground and save to DB
   Campground.create(newCampground, function(err, newlyCreated){
       if(err){
        console.log(err);
       } else {
           req.flash("success", "Successfully added campground!");
           res.redirect("/campgrounds");
       }
   });
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find  the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {        
    Campground.findById(req.params.id, function (err, foundCampground) { 
        res.render("campgrounds/edit", {campground: foundCampground});
    });    
 }); 

//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "Successfully updated campground!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            Comment.remove({"_id": {$in: campground.comments}}, function(err){
                if(err){
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                Review.remove({"_id": {$in: campground.reviews}}, function(err){
                    if(err){
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                })
            })
            campground.remove();
            req.flash("success", "Successfully deleted campground!");
            res.redirect("/campgrounds");
        }
    });
});





// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;