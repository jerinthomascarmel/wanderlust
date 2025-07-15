const Listing = require('./model/listing.js');
const ExpressError = require('./utils/ExpressError.js');
let { listingSchema, reviewSchema } = require('./schema.js');
const Review = require('./model/review.js');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; //save url 
        req.flash('error', 'you are not logged in!');
        return res.redirect('/login');
    }
    return next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    res.locals.redirectUrl = req.session.redirectUrl;
    next();
}

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash('error', "you don't have permission ");
        console.log('/listings/' + id);
        return res.redirect(`/listings/${id}`);
    }
    return next();
}


module.exports.validateListing = (req, res, next) => {
    // if (!neededKeys.every((key) => key in req.body)) throw new ExpressError(400, 'send valid listing');
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(400, errMsg);
    }
    return next();
}


module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(400, errMsg);
    }
    return next();
}

module.exports.isAuthorReview = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'you have no permission to access review');
        return res.redirect(`/listings/${id}`);
    }
    return next();
}