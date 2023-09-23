const express = require("express");
const router = express.Router();
const { checkSessionForAuthentication } = require("../middleware/session");
const cartController = require("../controllers/cartController");

router.use(checkSessionForAuthentication);

// GET CART MIDDLEWARE //

// Save cart updated on client side
router.put("/save-cart", cartController.saveCart);

// Perform updates server-side
router.post("/add-item", cartController.addItem);
router.patch("/update-item-quantity", cartController.updateItemQuantity)
router.delete("/remove-item", cartController.removeItem);

module.exports = router;