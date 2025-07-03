module.exports = (fn) => {
    return function (req, res, next) {
        return fn(req, res, next).catch((err) => {
            console.dir(err);
            return next(err)
        });
    }
}