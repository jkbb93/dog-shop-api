const bcrypt = require("bcrypt");
const User = require("../models/user");

module.exports.findUser = async (query) => {
    const foundUser = await User.findOne(query);
    if (!foundUser) return null;
    // return foundUser.toObject({ versionKey: false });  // Convert Mongoose Doc to JS Object
    return foundUser;
};

module.exports.rejectExistingUser = (user) => {
    if (user) {
        const error = new Error("User already exists!");
        error.status = 409;
        throw error;
    }
};

module.exports.createNewUser = async (userDetails) => {
    const createdUser = await User.create(userDetails);
    return createdUser.toObject({ versionKey: false });  // Convert Mongoose Doc to JS Object
};

module.exports.hashPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    return hashedPassword;
};

module.exports.verifyPassword = async (enteredPassword, storedPassword) => {
    const match = await bcrypt.compare(enteredPassword, storedPassword);
    if (!match) throw new Error("Authentication failed");
};

module.exports.mergeCarts = async (cart, foundUserDetails) => {
    const {
        items: clientItems,
        totalQuantity: clientTotalQuantity,
        totalPrice: clientTotalPrice
    } = cart;

    // If no client items, just early return stored items from user account
    if (clientItems.length === 0) return foundUserDetails.cart;

    /* Compare submitted cart with saved cart; merge into a new array by updating quantities
     of existing items or adding new ones */
    const storedItems = [...foundUserDetails.cart.items];

    const newOrUpdatedItems = clientItems.map(clientItem => {
        // Check if client cart item is in their saved cart already; return its index if so
        const matchingItemIndex = storedItems.findIndex(
            (storedItem) => storedItem._id === clientItem._id
        );
        // If item not already in saved cart, it's new and no update needed; return it right away
        if (matchingItemIndex === -1) return clientItem;

        // If item is in saved cart, create an updated copy with combined quantity
        const updatedItem = {
            ...clientItem,
            quantity: clientItem.quantity + storedItems[matchingItemIndex].quantity
        };

        // Remove the matching item from the saved cart, return its updated version
        storedItems.splice(matchingItemIndex, 1);
        return updatedItem;
    });
    // Combine remaining saved items with new/updated ones
    const mergedItems = [...storedItems, ...newOrUpdatedItems];

    // Calculate totals
    const {
        totalQuantity: storedTotalQuantity,
        totalPrice: storedTotalPrice
    } = foundUserDetails.cart;
    const updatedTotalQuantity = clientTotalQuantity + storedTotalQuantity;
    const updatedTotalPrice = clientTotalPrice + storedTotalPrice;

    // Create new cart from stored items and new/updated items
    const cartUpdate = {
        items: mergedItems,
        totalQuantity: updatedTotalQuantity,
        totalPrice: updatedTotalPrice
    };

    // Update user account with new cart, then return the cart
    // const updatedCart = await User.findOneAndUpdate(
    //     { _id: foundUserDetails._id },
    //     { cart: cartUpdate },
    //     { new: true }
    // ).select("-_id cart").lean();
    foundUserDetails.cart = cartUpdate;
    const { cart: updatedCart } = await foundUserDetails.save();
    console.log("ucart", updatedCart);
    return updatedCart;
};

// module.exports.updateUserOnDB = async (userID, update, options, select) => {
//     const updatedUser = await User.findOneAndUpdate(
//         {_id: userID},
//         {...update},
//         {...options}  // Option to return updated record
//     ).select(select).lean();
//     return updatedUser;
// };

module.exports.deleteUserAccountFromDB = async (userID) => {
    const response = await User.deleteOne({ _id: userID });
    if (response.deletedCount === 0) throw new Error("Failed to delete user account");
};