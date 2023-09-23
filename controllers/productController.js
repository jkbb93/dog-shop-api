const productService = require("../services/productService");

const getAllProducts = async (req, res, next) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).send({
            message: "Products retrieved successfully",
            products: products
        });
    } catch (error) {
        next({ status: 500, message: "Failed to get products", error });
    }
};

const createNewProducts = async (req, res, next) => {
    try {
        const createdProducts = await productService.createNewProducts(req.body);
        res.status(201).send({
            message: "Product(s) created successfully",
            products: createdProducts
        });
    } catch (error) {
        next({ status: 500, message: "Failed to create product(s)", error });
    }
};

module.exports = {
    getAllProducts,
    createNewProducts
};

