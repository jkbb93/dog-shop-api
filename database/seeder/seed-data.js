/* Schema:
{
    _id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String
}
*/

module.exports = JSON.stringify({
    name: "Coffee",
    price: 2.50,
    description: "Smooth"
});

