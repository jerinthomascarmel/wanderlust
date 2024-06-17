const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('./../model/listing.js');


main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
    await Listing.deleteMany({});
    let sampleListings = initData.data;

    let listings = sampleListings.map((obj) => {
        return {
            ...obj,owner: '6669548434911fb4ba14fcd4'
        };
    });

    Listing.insertMany(listings)
        .catch((err) => console.log(err));
}

initDB().then(() => console.log('added'));

// Listing.find({ _id: '66629386cef36d969c3d899d' }).then((res) => console.log(res)).catch(err => console.log(err));