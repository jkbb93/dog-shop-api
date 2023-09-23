const userService = require("../services/userService");
const userValidators = require("../validators/userValidators");
const { destroySession } = require("../middleware/session");

const signup = async (req, res, next) => {
    const { email, password, firstName, lastName, cart } = req.body;
    try {
        // Validate submitted user details
        userValidators.validateAuthCredentials({ email, password });
        userValidators.validateUserProfile(firstName, lastName);
        // const validatedCart = await userValidators.validateCart(cart);
        const validatedCart = cart;

        // Check if user already exists
        const existingUser = await userService.findUser({ email: email });
        userService.rejectExistingUser(existingUser);

        // Hash password
        const hashedPassword = await userService.hashPassword(password);

        // Save user
        const createdUserDetails = await userService.createNewUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            cart: validatedCart
        });

        // Add userID to Session
        req.session.userID = createdUserDetails._id;

        // Response
        res.status(201).send({
            // message: "Signup successful",
            email: createdUserDetails.email,
            firstName: createdUserDetails.firstName,
            lastName: createdUserDetails.lastName,
            cart: createdUserDetails.cart
        });
    } catch (error) {
        next({ status: error.status || 500, message: error.message, error });
    }
};


const login = async (req, res, next) => {
    const { email, password, cart } = req.body;

    try {
        // Validate submitted user details
        userValidators.validateAuthCredentials({ email, password });
        // const validatedCart = await userValidators.validateCart(cart);
        const validatedCart = cart;
        console.log("vcart", validatedCart);

        // Find user on database
        const foundUser = await userService.findUser({ email: email });
        if (!foundUser) throw new Error("User not found");

        // Verify user password
        await userService.verifyPassword(password, foundUser.password);

        // Merge guest cart with user's saved cart
        const mergedCart = await userService.mergeCarts(validatedCart, foundUser);
        console.log("mcart", mergedCart);

        // Add ID to Session
        req.session.userID = foundUser._id;

        // Response
        res.status(200).send({
            // message: "Login successful",
            email: foundUser.email,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            cart: mergedCart
        });
    } catch (error) {
        next({ status: error.status || 500, message: error.message, error });
    }
};

const logout = (req, res, next) => {
    destroySession(req.session);
    res.sendStatus(204);
};

const resumeSession = async (req, res, next) => {
    const userID = req.session?.userID;

    if (!userID) {
        console.log("User does not have active session");
        res.sendStatus(204);
        return;
    }

    try {
        // Find user on database
        const foundUser = await userService.findUser({ _id: userID });
        if (!foundUser) throw new Error("User not found");
        const { email, firstName, lastName, cart } = foundUser;

        // Response
        res.status(200).send({
            email,
            firstName,
            lastName,
            cart
        });

    } catch (error) {
        next({ status: error.status || 500, message: error.message, error });
    }
}

const changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userID = req.session.userID;
    try {
        // Validate submitted passwords, make sure they are not the same
        userValidators.validateAuthCredentials({ password: currentPassword, newPassword: newPassword });

        // Retrieve user account and verify password
        const foundUser = await userService.findUser({ _id: userID });
        await userService.verifyPassword(currentPassword, foundUser.password);

        // Hash new password and save to account
        const hashedNewPassword = await userService.hashPassword(newPassword);
        foundUser.password = hashedNewPassword;
        await foundUser.save();

        res.sendStatus(204);
    } catch (error) {
        next({ message: "Failed to update password", error });
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        const userID = req.session.userID;
        await userService.deleteUserAccountFromDB(userID);
        destroySession(req.session);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};


module.exports = {
    signup,
    login,
    logout,
    resumeSession,
    changePassword,
    deleteAccount
};