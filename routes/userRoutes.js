const express = require("express");
const router = express.Router();
const cartRouter = require("./cartRoutes");
const { verifyAuthTokenMiddleware } = require("../utils/jwt");
const userController = require("../controllers/userController");
const { checkSessionForAuthentication } = require("../middleware/session");

router.use("/cart", cartRouter);

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/resume-session", userController.resumeSession);
router.post("/logout", checkSessionForAuthentication, userController.logout);
router.post("/change-password", checkSessionForAuthentication, userController.changePassword);
router.delete("/delete-account", checkSessionForAuthentication, userController.deleteAccount);

module.exports = router;