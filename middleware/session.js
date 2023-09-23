const session = require("express-session");
const MongoStore = require("connect-mongo");
const {connection: mongooseConnection} = require("mongoose");

// Mongo Client promise for MongoStore
const mongoClientPromise = new Promise((resolve) => {
    mongooseConnection.on("connected", () => {
        const client = mongooseConnection.getClient();
        resolve(client);
    });
});

// Configure session store (MongoStore)
const sessionStore = MongoStore.create({
    clientPromise: mongoClientPromise,
    dbName: "portfolio",
    collection: "sessions"
});

// Create session
module.exports.session = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 1000 * 60 * 60 * 72 }, // Session expires after 72 hours
    rolling: true, // Resets cookie maxAge on each request; i.e. session will expire *maxAge* later than last activity
});

// Check authentication status in session
module.exports.checkSessionForAuthentication = (req, res, next) => {
    if (req.session?.userID) {
        console.log("User is authenticated");
        next();
    } else {
        next({ status: 401, message: "User is not authenticated" });
    }
};

// Destroy session e.g. on user logout
module.exports.destroySession = (session) => {
    session.destroy(() => console.log("User session terminated"));
};