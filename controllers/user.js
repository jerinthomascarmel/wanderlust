const User = require('../model/user.js');

module.exports.renderSignupForm = (req, res) => {
    res.render('./users/signup.ejs');
}

module.exports.signup = async (req, res) => {    
    try {
        let { username, email, password } = req.body;
        let newUser = new User({
            username: username,
            email: email
        });
        let registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'User registered successfully!');
            res.redirect('/listings');
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/signup');
    }
}


module.exports.renderLoginForm = (req, res) => {
    res.render('./users/login.ejs');
}

module.exports.login = (req, res) => {
    req.flash('success', 'user has login successfully!');
    let url = res.locals.redirectUrl || '/listings';
    return res.redirect(url);
}

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'you logged out!');
        res.redirect('/listings');
    })
}