require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080;
const connectToDb = require("./database/database");
const { session } = require("./middleware/session");
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const errorHandler = require("./middleware/error-handler");
const pathNotFoundHandler = require("./middleware/not-found-handler");

// Start server
connectToDb();
app.listen(port, () => { console.log("Server running on port " + port) });

const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN,
  methods: 'GET,POST,PUT,PATCH,DELETE',
  credentials: true,
  allowedHeaders: 'Content-Type', // Allow only the 'Content-Type' header
  optionsSuccessStatus: 200, // Use 200 for OPTIONS requests
};

app.use(cors(corsOptions));

app.options('/user/resume-session', cors(corsOptions));


// !!!!!! REMOVE BEFORE DEPLOYMENT - CORS POLICY. WILL NEED TO CONFIGURE IF FRONTEND APP HOSTED SEPARATELY TO BACKEND
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', req.header("origin"));
//   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   if (req.method === "OPTIONS") {
//     res.sendStatus(200);
//     return;
//   }
//   next();
// });
// For deployment, no need for site to be accessed from any other domain. 

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(session);

// Routes
app.use("/products", productRouter);
app.use("/user", userRouter);

// Error handler
app.use(errorHandler);

// Non-existing route/path handler
app.use("*", pathNotFoundHandler);