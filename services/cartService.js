const User = require("../models/user");

const saveCartToDatabase = async (userAccountDocument, cartToSave) => {
    userAccountDocument.cart = cartToSave;
    const {cart: savedCart} = await userAccountDocument.save();
    return savedCart;
}

const updateCartOnDB = async (userID, update) => {
    const updatedCart = await User.findOneAndUpdate(
        { _id: userID },
        { cart: update },
        { new: true }  // Option to return updated record
    ).select("-_id cart").lean();
    return updatedCart;
};

const removeItemFromStoredCart = async (itemToRemove, storedCart, userID) => {
    const storedCartItems = [...storedCart.items];
    const indexOfItemToRemove = storedCartItems.findIndex(
        (storedCartItem) => storedCartItem._id.toString() === itemToRemove
    );
    if (indexOfItemToRemove === -1) throw new Error("Item not in stored cart");

    const [removedItem] = storedCartItems.splice(indexOfItemToRemove, 1);
    const remainingItems = storedCartItems;

    const cartUpdateToPerform = {
        items: remainingItems,
        totalQuantity: storedCart.totalQuantity - removedItem.quantity,
        totalPrice: storedCart.totalPrice - (removedItem.quantity * removedItem.price)
    };

    const updatedCart = await updateCartOnDB(userID, cartUpdateToPerform);
    return updatedCart;
};


const updateStoredItemQuantity = async (itemToUpdate, storedCart, userID) => {
    // If new quantity is 0, redirect to removeItemFromStoredCart
    if (+itemToUpdate.newQuantity === 0) return await removeItemFromStoredCart(itemToUpdate._id, storedCart, userID);

    // Verify itemToUpdate is in storedCart
    const storedCartItems = [...storedCart.items];
    const indexOfItemToUpdate = storedCartItems.findIndex(
        (storedCartItem) => storedCartItem._id.toString() === itemToUpdate._id
    );
    if (indexOfItemToUpdate === -1) throw new Error("Item not in stored cart");

    // Take matching stored item and get data to calculate totals
    matchingStoredItem = storedCartItems[indexOfItemToUpdate];
    const itemPrice = matchingStoredItem.price;
    const oldItemQuantity = matchingStoredItem.quantity;
    const newItemQuantity = +itemToUpdate.newQuantity;

    // No idea how I worked out the maths, but it works: calculate new totals
    const quantityDifference = newItemQuantity - oldItemQuantity;
    const priceDifference = (newItemQuantity * itemPrice) - (oldItemQuantity * itemPrice);
    const newTotalQuantity = storedCart.totalQuantity + quantityDifference;
    const newTotalPrice = storedCart.totalPrice + priceDifference;

    // Set quantity of item to new quantity
    matchingStoredItem.quantity = newItemQuantity;

    // Assemble update to be applied
    const cartUpdateToPerform = {
        items: storedCartItems,
        totalQuantity: newTotalQuantity,
        totalPrice: newTotalPrice
    };

    // Make update by calling DB
    const updatedCart = await updateCartOnDB(userID, cartUpdateToPerform);
    return updatedCart;
};

module.exports = {
    saveCartToDatabase,
    removeItemFromStoredCart,
    updateStoredItemQuantity,
    //updateStoredItemQuantityRefactor
};