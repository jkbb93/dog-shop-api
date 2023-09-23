const Joi = require("joi");
const { isObjectIdOrHexString } = require("mongoose");
const Product = require("../models/product");

function createValidationError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

module.exports.validateAuthCredentials = (authCredentials) => {
    const { email, password, newPassword } = authCredentials;

    // Configure validation criteria for credentials
    const emailValidation = Joi.string().required().email();
    const passwordValidation = Joi.string().required().min(8);

    // Set schema to use based on which credentials were submitted; assign validation criteria to use via schema
    let schema;
    if (email && password && !newPassword) {
        schema = Joi.object({ email: emailValidation, password: passwordValidation });
    }

    if (password && newPassword && !email) {
        schema = Joi.object({ password: passwordValidation, newPassword: passwordValidation });
    }

    // If credentials are missing/extra there will be no schema, so throw exception
    if (!schema) throw new Error("User credentials invalid");

    // Perform validation, throw if not passing
    const { error } = schema.validate(authCredentials);
    if (error) throw new Error("User credentials invalid");

    // When two passwords are submitted for changePassword, fail if they are the same
    if(password === newPassword) throw new Error("Passwords must not be the same");
};


module.exports.validateUserProfile = (firstName, lastName) => {
    const schema = Joi.object({
        firstName: Joi.string()
            .required()
            .max(35),
        lastName: Joi.string()
            .required()
            .max(35)
    });

    const { error } = schema.validate({ firstName, lastName });

    if (error) {
        const validationError = createValidationError("Validation failed");
        throw validationError;
    }
};


const checkCartIsArray = (cartItems) => {
    const cartIsNotArray = !Array.isArray(cartItems);
    if (cartIsNotArray) throw new Error("Cart invalid");
};


const handleEmptyCart = (cartItems) => {
    if (cartItems.length === 0) {
        return {
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
        };
    }
};


const validateCartItemID = (id) => {
    const isValidID = isObjectIdOrHexString(id);
    if (!isValidID) throw new Error("Cart item ID invalid");
};


const validateCartItemQuantity = (submittedQuantity, options) => {
    const quantity = +submittedQuantity;

    // Verify number is integer, and zero or greater (isInteger also confirms Number type; will fail if NaN)
    const isValidQuantity = Number.isInteger(quantity) && (quantity >= 0);
    if (!isValidQuantity) throw new Error("Cart item quantity invalid");

    // Fail if quantity is 0 when no zeroPermitted flag
    const quantityIsZero = (quantity === 0);
    const zeroPermitted = options?.zeroPermitted;
    if (quantityIsZero && !zeroPermitted) throw new Error("Cart item quantity cannot be zero");
};


const verifyItemsExistAsProducts = async (itemIds) => {
    const foundProducts = await Product.find({ _id: { $in: itemIds } }).lean();
    if (foundProducts.length !== itemIds.length) throw new Error("Cart item(s) not valid product(s)");
    return foundProducts;
};

const hydrateItemsWithProductDetails = (cartItems, foundProducts) => {
    const hydratedCartItems = cartItems.map(cartItem => {
        const matchingProduct = foundProducts.find(foundProduct => {
            return foundProduct._id.toString() === cartItem._id
        });

        const hydratedItem = {
            _id: matchingProduct._id.toString(),
            name: matchingProduct.name,
            price: matchingProduct.price,
            quantity: +cartItem.quantity
        };

        return hydratedItem;
    });
    return hydratedCartItems;
};

const calculateCartTotals = (cartItems) => {
    let totalQuantity = 0;
    let totalPrice = 0;
    cartItems.forEach(item => {
        totalQuantity += item.quantity;
        totalPrice += (item.quantity * item.price);
    });
    return { totalQuantity, totalPrice };
};


module.exports.validateCart = async (cart) => {
    const cartItems = cart?.items;
    checkCartIsArray(cartItems);
    handleEmptyCart(cartItems);

    const itemIds = [];
    cartItems.forEach(cartItem => {
        const { _id: id, quantity } = cartItem;
        validateCartItemID(id);
        validateCartItemQuantity(quantity);
        itemIds.push(id);
    });

    const foundProducts = await verifyItemsExistAsProducts(itemIds);
    const hydratedCartItems = hydrateItemsWithProductDetails(cartItems, foundProducts);

    const cartTotals = calculateCartTotals(hydratedCartItems);

    return { items: hydratedCartItems, ...cartTotals };
};

module.exports.validateCartItemID = validateCartItemID;
module.exports.validateCartItemQuantity = validateCartItemQuantity;