const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const { validateReview, isLoggedIn, isAuthorReview } = require('../middleware.js');
const ReviewController = require('../controllers/reviews.js');

//reviews 
// review create route
router.post('/', isLoggedIn, validateReview, wrapAsync(ReviewController.createReview));
//review delete route 
router.delete('/:reviewId', isLoggedIn, isAuthorReview, wrapAsync(ReviewController.destroyReview));
module.exports = router;