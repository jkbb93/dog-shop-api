const mongoose = require("mongoose");

// Configure reconnection attempts
const maxReconnectionAttempts = 2;
let remainingReconnectionAttempts = maxReconnectionAttempts;
let isInitialConnectionAttempt = true;

// DB connection options
const uri = process.env.DB_URI;
const options = {
    dbName: "portfolio"
};

// Connect to database
async function connectToDb() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(uri, options);

        console.log("Database connection successful");

        remainingReconnectionAttempts = maxReconnectionAttempts;   // Reset remaining connection attempts if connected
        if (isInitialConnectionAttempt) addConnectionListeners();    // Add connection listeners on first successful connection
        isInitialConnectionAttempt = false;
    } catch (error) {
        console.error(`FAILED TO CONNECT TO DATABASE \n${error}`);
        if (isInitialConnectionAttempt && (remainingReconnectionAttempts > 0)) {
            attemptReconnect();
        }
    }
}

// Connection error/disconnection event handler
function disconnectHandler() {
    attemptReconnect();
}

let isError = false;

// Add listeners for connection issues
function addConnectionListeners() {
    const connection = mongoose.connection;
    connection.on("error", (error) => { isError = error });
    connection.on("disconnected", disconnectHandler);
}

// Attempt reconnection on disconnect
function attemptReconnect() {
    if (isError) console.log(isError);
    let countdown = 5;
    console.log(`ATTEMPTING DATABASE RECONNECTION IN ${countdown} SECONDS...`);

    let ticker = setInterval(() => {
        if (countdown === 0) {
            remainingReconnectionAttempts--;
            connectToDb();
            clearInterval(ticker);
            return;
        }
        console.log(countdown);
        countdown--;
    }, 1000);
}

module.exports = connectToDb

