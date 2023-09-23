const mongoose = require("mongoose");

const stringAndRequired = { type: String, required: true };
const numberAndRequired = { type: Number, required: true };

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: stringAndRequired,
        firstName: stringAndRequired,
        lastName: stringAndRequired,
        cart: {
            items: { type: Array, required: true },
            totalQuantity: numberAndRequired,
            totalPrice: numberAndRequired,
        },
    }
);

module.exports = mongoose.model("User", userSchema);