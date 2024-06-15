
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js');
const { required } = require('joi');

const defaultImageUrl = 'https://wallup.net/wp-content/uploads/2016/03/10/318375-nature-landscape-lake-mountain-forest-wildflowers-spring-pine_trees-path-Switzerland-HDR.jpg';
const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        default: defaultImageUrl,
        set: (v) => v === '' ? defaultImageUrl : v
    },
    price: {
        type: Number,
    },
    location: {
        type: String,
    },
    country: {
        type: String,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

listingSchema.post('findOneAndDelete', async (listing) => {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;