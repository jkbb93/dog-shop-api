const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

async function createAuthToken(id) {
    return await jwt.sign({ id }, secret, { expiresIn: '1h' });
}

async function verifyAuthTokenMiddleware(req, res, next) {
    const cookie = req.headers.cookie;
    if (!cookie) {
        next({ status: 401, message: "User not authenticated" });
        return;
    }
    try {
        const token = cookie.split("token=")[1].split(";")[0];
        const payload = await jwt.verify(token, secret);
        req.authId = payload.id;
        next();
    } catch (error) {
        next({ status: 401, message: "Authentication failed", error });
    }
}

module.exports = {
    createAuthToken,
    verifyAuthTokenMiddleware
};

