const User = require("../models/user");
const Product = require("../models/product");
const { isObjectIdOrHexString, model } = require("mongoose");

module.exports.validateCart = async (req, res, next) => {
    try {
        const cartItems = req.body.cart?.items;
        const cartItemsInvalid = cartItems && !Array.isArray(cartItems);
        if (cartItemsInvalid) throw new Error("Cart invalid");

        if (!cartItems || cartItems.length === 0) {
            req.validatedCart = {
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
            };
            next();
            return;
        }

        const itemIds = [];
        cartItems.forEach(cartItem => {
            const _id = cartItem._id;
            const quantity = +cartItem.quantity;
            if (!_id || !quantity) throw new Error("Cart item(s) invalid");

            const _idIsValid = isObjectIdOrHexString(_id);
            const quantityIsValid = Number.isInteger(quantity) && (quantity > 0 && quantity < 101);
            if (!quantityIsValid || !_idIsValid) throw new Error("Cart item(s) invalid");

            itemIds.push(_id);
        });

        const foundProducts = await Product.find({ _id: { $in: itemIds } });
        if (foundProducts.length !== itemIds.length) throw new Error("Cart item(s) not valid product(s)");

        // Hydrate cart from database product
        const validatedItems = cartItems.map(cartItem => {
            const matchingProduct = foundProducts.find(foundProduct =>
                foundProduct._id.toString() === cartItem._id
            );

            const validatedItem = {
                _id: matchingProduct._id.toString(),
                name: matchingProduct.name,
                price: matchingProduct.price,
                quantity: +cartItem.quantity
            };

            return validatedItem;
        });

        // Calculate totals
        let totalPrice = 0;
        let totalQuantity = 0;
        validatedItems.forEach(item => {
            totalPrice += (item.quantity * item.price);
            totalQuantity += item.quantity;
        });

        req.validatedCart = { items: validatedItems, totalQuantity, totalPrice };
        next();
    } catch (error) {
        next({ status: 400, message: "Validation failed", error });
    }
};


module.exports.mergeCarts = async (req, res, next) => {
    const {
        items: clientItems,
        totalQuantity: clientTotalQuantity,
        totalPrice: clientTotalPrice
    } = req.validatedCart;

    if (clientItems.length === 0) {
        next();
        return;
    }

    const storedItems = req.user.cart.items;

    const updatedItems = clientItems.map(clientItem => {
        const matchingStoredItem = storedItems.find(storedItem =>
            storedItem._id === clientItem._id
        );
        if (!matchingStoredItem) return clientItem;

        const updatedItem = {
            ...clientItem,
            quantity: clientItem.quantity + matchingStoredItem.quantity
        };

        return updatedItem;
    });

    const {
        totalQuantity: storedTotalQuantity,
        totalPrice: storedTotalPrice
    } = req.user.cart;
    const updatedTotalQuantity = clientTotalQuantity + storedTotalQuantity;
    const updatedTotalPrice = clientTotalPrice + storedTotalPrice;

    const updatedCart = {
        items: updatedItems,
        totalQuantity: updatedTotalQuantity,
        totalPrice: updatedTotalPrice
    };

    try {
        const updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, { cart: updatedCart }, { new: true });
        req.user = updatedUser;
        next();
    } catch (error) {
        next({ status: 500, message: "Unable to update cart", error });
    }
};

//Add validation to input
exports.updateItemQuantity = async (req, res, next) => {
    const { submittedItem } = req.body;
    const { _id } = req.user;

    const user = await User.findByIdAndUpdate({_id}, {$set: {"cart.items.$._id": submittedItem._id}});
    if(!user) throw new Error("User not found");

    const storedItems = user.cart.items;



    const matchingStoredItem = storedItems.find(storedItem => storedItem._id === submittedItem._id);
    if(!matchingStoredItem) throw new Error("Item not found");

    storedItems.pop(matchingStoredItem);

    const updatedItem = {
        ...matchingStoredItem,
        quantity: submittedItem.quantity
    };
    storedItems.push(updatedItem);

    User.findByIdAndUpdate({_id}, {update})

}