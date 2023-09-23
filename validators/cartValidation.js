const { isObjectIdOrHexString } = require("mongoose");
const Product = require("../models/product");

const checkCartIsArray = (cartItems) => {
    const cartIsArray = Array.isArray(cartItems);
    if (!cartIsArray) throw new Error("Cart invalid");
};

const handleEmptyCart = (cartItems) => {
    if (cartItems.length === 0) {
        return {
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
        };
    }

    return null;
};

const validateCartItemID = (id) => {
    // ID should be Mongoose Object ID or Hex String
    const isValidID = isObjectIdOrHexString(id);
    if (!isValidID) throw new Error("Cart item ID invalid");
};

const validateCartItemQuantity = (submittedQuantity, options) => {
    const quantity = +submittedQuantity;

    // Verify number is integer, and zero or greater (isInteger also confirms Number type; will fail if NaN)
    const isValidQuantity = Number.isInteger(quantity) && (quantity >= 0);
    if (!isValidQuantity) throw new Error("Cart item quantity invalid");
};


const validateInvidivualCartItems = (cartItems) => {
    cartItems.forEach(cartItem => {
        const { id, quantity } = cartItem;
        validateCartItemID(id);
        validateCartItemQuantity(quantity);
    });
};

const findMatchingProductsOnDatabase = async (itemIDs) => {
    const foundProducts = await Product.find({ _id: { $in: itemIDs } }).lean();
    return foundProducts;
};

const verifyCartItemsAreRealProducts = async (cartItems) => {
    const itemIDs = cartItems.map(cartItem => cartItem.id);
    const foundProducts = await findMatchingProductsOnDatabase(itemIDs);
    
    // Every ID should have returned a DB result - compare length of arrays to check
    if (foundProducts.length !== itemIDs.length) throw new Error("Cart item(s) not valid product(s)");
}

const recreateCartItemsWithProductData = (cartItems, products) => {

    const getMatchingProduct = (cartItem) => {
        const matchingProduct = products.find(product => (product._id.toString() === cartItem.id));
        return matchingProduct;
    };

    const recreatedCartItems = cartItems.map(cartItem => {
        const matchingProduct = getMatchingProduct(cartItem);
        const { _id, name, unitPrice } = matchingProduct;

        const recreatedItem = {
            _id: _id.toString(),
            name,
            unitPrice,
            quantity: +cartItem.quantity
        };

        return recreatedItem;
    });

    return recreatedCartItems;
};

const calculateCartTotals = (cartItems) => {
    let totalQuantity = 0;
    let totalPrice = 0;
    cartItems.forEach(cartItem => {
        totalQuantity += cartItem.quantity;
        totalPrice += (cartItem.quantity * cartItem.price);
    });
    return { totalQuantity, totalPrice };
};


module.exports.validateCart = async (cart) => {
    const cartItems = cart?.items;

    // Validate cart is an array of items and handle if empty
    checkCartIsArray(cartItems);
    const emptyCart = handleEmptyCart(cartItems);
    if (emptyCart) return emptyCart;

    // Validate individual cart item data
    validateInvidivualCartItems(cartItems);

    // Verify cart items are real products
    verifyCartItemsAreRealProducts(cartItems);

    // Recreate the cart with stored product data, calculate cart totals using recreated items
    const recreatedCartItems = recreateCartItemsWithProductData(cartItems, foundProducts);
    const validCartTotals = calculateCartTotals(recreatedCartItems);

    const validatedCart = {
        items: recreatedCartItems,
        ...validCartTotals,
    };

    return validatedCart;
};