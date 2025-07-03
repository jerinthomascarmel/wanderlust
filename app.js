if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const User = require('./model/user.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');


const listingRoute = require('./routes/listingRoute.js');
const reviewRoute = require('./routes/reviewRoute.js');
const userRoute = require('./routes/userRoute.js');


const port = 8080;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

const dbUrl = 'mongodb+srv://jerinthomascarmel:Gu5zfQDoV12EJ9sH@cluster0.pmbprsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 3600,
    crypto: {
        secret: 'squirrel'
    }
});

store.on('error', (err) => {
    console.log("ERROR in MONGO SESSION STORE ", err);
})

const secret = process.env.SESSION_SECRET;
const sessionOptions = {
    secret,
    store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(dbUrl);
}


app.listen(port, () => {
    console.log(`connected at port ${port}`);
});


app.get('/', (req, res) => {
    res.send("this is root!");
});

app.get('/demoUser', async (req, res) => {
    let fakeUser = new User({
        email: 'jerinfake@gmail.com',
        username: 'fakeuser'
    });

    let registeredUser = await User.register(fakeUser, 'password');
    res.send(registeredUser);
})

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});


app.use('/listings', listingRoute);
app.use('/listings/:id/reviews', reviewRoute);
app.use('/', userRoute);


// if no route exist
app.all('*', (req, res, next) => {
    next(new ExpressError(404, 'Page not found!'));
});

//error handling 
app.use((err, req, res, next) => {
    let { status = 500, message = 'some error occured ' } = err;
    res.status(status).render('error.ejs', { message });
});