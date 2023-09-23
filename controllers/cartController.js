const userService = require("../services/userService");
const cartService = require("../services/cartService");
const { validateCart, validateCartItemID, validateCartItemQuantity } = require("../validators/userValidators");
const { removeItemFromStoredCart, updateStoredItemQuantity, updateStoredItemQuantityRefactor } = require("../services/cartService");
const { validateCart: cartValidation } = require("../validators/cartValidation");

const saveCart = async (req, res, next) => {
    try {
        const foundUserDocument = await userService.findUser({ _id: req.session.userID });

        // const validatedCart = await cartValidation(req.body);
        const validatedCart = req.body;
        const savedCart = await cartService.saveCartToDatabase(foundUserDocument, validatedCart);

        res.status(200).send({
            ...savedCart,
        });
    } catch (error) {
        next({message: error.message, error});
    }
};


const addItem = async (req, res, next) => {
    try {
        const foundUser = await userService.findUser({ _id: req.session.userID });
        const validatedCart = await validateCart(req.body.cart);
        const updatedCart = await userService.mergeCarts(validatedCart, foundUser);

        res.status(201).send({
            message: "Item added to cart successfully",
            ...updatedCart
        });
    } catch (error) {
        next({ message: error.message, error });
    }
};

const updateItemQuantity = async (req, res, next) => {
    try {
        const itemToUpdate = req.body.itemToUpdate;
        if(!itemToUpdate) throw new Error("Invalid item");

        validateCartItemID(itemToUpdate._id);
        validateCartItemQuantity(itemToUpdate.newQuantity, { zeroPermitted: true });

        const foundUser = await userService.findUser({ _id: req.session.userID });
        const { cart: storedCart, _id: userID } = foundUser;

        const updatedCart = await updateStoredItemQuantity(itemToUpdate, storedCart, userID);

        res.status(200).send({
            message: "Item quantity updated successfully",
            ...updatedCart
        });
    } catch (error) {
        next({ message: error.message, error });
    }
};

const removeItem = async (req, res, next) => {
    try {
        const itemToRemove = req.body.itemToRemove
        validateCartItemID(itemToRemove);

        const foundUser = await userService.findUser({ _id: req.session.userID });
        const { cart: storedCart, _id: userID } = foundUser;

        const updatedCart = await removeItemFromStoredCart(itemToRemove, storedCart, userID);

        res.status(200).send({
            message: "Item removed successfully",
            ...updatedCart
        });
    } catch (error) {
        next({ message: error.message, error });
    }
}

module.exports = {
    saveCart,
    addItem,
    updateItemQuantity,
    removeItem
}