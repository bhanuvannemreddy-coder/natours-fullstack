const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

// ==========================================
// AUTHENTICATION
// ==========================================

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// ==========================================
// CURRENT USER
// These are available to the logged-in user
// for managing THEIR OWN account.
// ==========================================

router.get("/me", authController.protect, authController.getMe);

router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updateMyPassword,
);

router.patch("/updateMe", authController.protect, userController.updateMe);

router.delete("/deleteMe", authController.protect, userController.deleteMe);

// ==========================================
// ADMIN USER MANAGEMENT
// Only ADMIN can use these routes.
// ==========================================

// Get all users
// GET /api/v1/users
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    userController.getAllUsers,
  )

  // Create a new user
  // POST /api/v1/users
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    userController.createUser,
  );

// Get / Update / Delete one user
// Only ADMIN
router
  .route("/:id")

  // GET /api/v1/users/:id
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    userController.getUser,
  )

  // PATCH /api/v1/users/:id
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    userController.updateUser,
  )

  // DELETE /api/v1/users/:id
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    userController.deleteUser,
  );

module.exports = router;
