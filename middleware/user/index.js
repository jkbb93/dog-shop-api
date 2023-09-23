const User = require("../../models/user");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


module.exports.validateAuthCredentials = (req, res, next) => {
    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string()
            .required()
            .email(),
        password: Joi.string()
            .required()
            .min(8)
    });

    const { error: validationError } = schema.validate({ email, password });
    if (validationError) {
        next({ status: 400, message: "User credentials invalid" });
        return;
    }
    next();
};

/////

module.exports.findUser = async (req, res, next) => {
    const email = req.body && req.body.email && { email: req.body.email };
    const _id = req.user && req.user._id && { _id: req.user._id };
    const query = (email || _id);

    if (!query) {
        next({ status: 400, message: "Unable to find user" });
        return;
    }

    try {
        req.user = await User.findOne(query);
        next();
    } catch (error) {
        next(error);
    }
};


module.exports.validateUserProfile = (req, res, next) => {
    const { firstName, lastName } = req.body;

    if (req.path === "/signup" && (!firstName || !lastName)) {
        next({ status: 400, message: "Validation failed" });
        return;
    }

    const schema = Joi.object({
        firstName: Joi.string()
            .max(35),
        lastName: Joi.string()
            .max(35)
    });

    const { error: validationError } = schema.validate({ firstName, lastName });
    if (validationError) {
        next({ status: 400, message: "Validation failed" });
        return;
    }
    next();
};


module.exports.hashPassword = async (req, res, next) => {
    const password = req.body.password;

    try {
        const hash = await bcrypt.hash(password, 12);
        req.hashedPassword = hash;
        next();
    } catch (error) {
        next(error);
    }
};


module.exports.verifyPassword = async (req, res, next) => {
    if (!req.user) {
        next({ status: 400, message: "User not found" });
        return;
    }
    const enteredPassword = req.body.password;
    const storedPassword = req.user.password;

    try {
        const match = await bcrypt.compare(enteredPassword, storedPassword);
        if (!match) {
            throw new Error();
        }
        next();
    } catch (error) {
        next({ status: 401, message: "Authentication failed", error });
    }
};


module.exports.createAuthToken = async (req, res, next) => {
    const { _id } = req.user;

    try {
        const token = await jwt.sign({ _id }, 'secretkey!!!!', { expiresIn: '1h' });
        res.cookie("token", token, { httpOnly: true });
        next();
    } catch (error) {
        next(error);
    }
};


module.exports.verifyAuthToken = async (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        next({ status: 401, message: "User not authenticated" });
        return;
    }
    const token = cookie.split("token=")[1].split(";")[0];

    try {
        const payload = jwt.verify(token, 'secretkey!!!!');
        req.user = { _id: payload._id };
        next();
    } catch (error) {
        next({ status: 401, message: "Authentication failed", error });
    }
};


