const User = require("../../models/user");

module.exports.rejectExistingUser = (req, res, next) => {
    if (req.user) {
        next({ message: "User already exists" });
        return;
    }
    next();
};

module.exports.saveNewUser = async (req, res, next) => {
    const { email, firstName, lastName } = req.body;
    const {
        hashedPassword: password,
        validatedCart: cart
    } = req;

    try {
        req.user = await User.create({
            email,
            password,
            firstName,
            lastName,
            cart
        });
        next();
    } catch (error) {
        next({ status: 400, message: "Unable to complete signup", error });
    }
};