module.exports = (req, res) => {
    res.status(404).send({message: "Path not found"});
};