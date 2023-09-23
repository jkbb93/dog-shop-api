const Product = require("../models/product");

module.exports.getAllProducts = async () => {
    const products = await Product.find({});
    return products.map(product => product.toObject({versionKey: false}));  // Convert Mongoose Doc to JS Object
};

module.exports.createNewProducts = async (productsToCreate) => {
    const createdProducts = await Product.create(productsToCreate);
    return createdProducts.map(createdProduct => createdProduct.toObject({versionKey: false}));  // Convert Mongoose Doc to JS Object
};