const express = require("express");
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");

const tourRouter = express.Router();

// Public
tourRouter
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Admin only
tourRouter
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.getMonthlyPlan,
  );

// Admin only
tourRouter
  .route("/tour-stats")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.getTourStats,
  );

// Get tours = logged-in users
// Create tour = admin only
tourRouter
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.createTour,
  );

// Get one = public
// Update/Delete = admin only
tourRouter
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.deleteTour,
  );

module.exports = tourRouter;
