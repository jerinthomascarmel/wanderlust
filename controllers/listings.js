const Listing = require('../model/listing.js');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_ACCESS_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res, next) => {
    let listings = await Listing.find();
    res.render('./listings/index.ejs', { listings });
}


module.exports.renderNewForm = (req, res) => {
    res.render('./listings/new.ejs');
}

module.exports.showListing = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate({
        path: 'reviews', populate: {
            path: 'author'
        }
    }).populate('owner');
    if (!listing) {
        req.flash('error', 'Listing not found!');
        res.redirect('/listings');
    }
    res.render('./listings/show.ejs', { listing });
}

module.exports.createListing = async (req, res, next) => {
    let geometryResult = await geocodingClient.forwardGeocode({
        query: req.body.location,
        limit: 1
    }).send();

    let url = req.file.path;//for image url
    let filename = req.file.filename; //for image  filename
    const newListing = new Listing(req.body);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometryResult.body.features[0].geometry;
    await newListing.save();

    req.flash('success', 'new Listing created!');
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found');
        res.redirect('/listings');
    }
    let dupliImageUrl = listing.image.url.replace('/upload', '/upload/h_300,w_250');
    res.render('./listings/edit.ejs', { listing, dupliImageUrl });
}

module.exports.updateListing = async (req, res, next) => {

    let { id } = req.params;
    let listing = req.body;
    let updatedListing = await Listing.findByIdAndUpdate(id, listing);

    if (typeof req.file != 'undefined') {
        let { path: url, filename } = req.file;
        updatedListing.image = { url, filename };
        await updatedListing.save();
    }
    req.flash('success', 'Listing updated!');
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing Deleted!');
    res.redirect('/listings');
}