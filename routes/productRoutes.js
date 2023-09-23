const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productController");

router.get("/", productsController.getAllProducts);
router.post("/create", productsController.createNewProducts);

module.exports = router;