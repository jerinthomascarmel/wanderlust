const Listing = require('../model/listing.js');

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
    const newListing = new Listing(req.body);
    newListing.owner = req.user._id;
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
    res.render('./listings/edit.ejs', { listing });
}

module.exports.updateListing = async (req, res, next) => {
    let { id } = req.params;
    let listing = req.body;
    await Listing.findByIdAndUpdate(id, listing);
    req.flash('success', 'Listing updated!');
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing Deleted!');
    res.redirect('/listings');
}