const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const ListingController = require('../controllers/listings.js');
const multer = require('multer')
const storage = require('../CloudConfig.js');
const upload = multer({ storage:storage });

//index route and create route
router.route('/')
    .get(wrapAsync(ListingController.index))
    // .post(isLoggedIn, validateListing, wrapAsync(ListingController.createListing));
    .post(upload.single('image'), (req, res) => {
        res.send(req.file);
    })

//new route
router.get('/new', isLoggedIn, ListingController.renderNewForm);

//show route and update route and delete route
router.route('/:id')
    .get(wrapAsync(ListingController.showListing))
    .put(isLoggedIn, isOwner, validateListing, wrapAsync(ListingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(ListingController.destroyListing));

//edit route
router.get('/:id/edit', isLoggedIn, isOwner, wrapAsync(ListingController.renderEditForm));

module.exports = router;