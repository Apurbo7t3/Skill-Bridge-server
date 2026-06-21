import { Router } from "express";
import { publicControllers } from "./public.controller";

const router = Router();

router.get("/public/advertisements", publicControllers.browseAdvertisements);
router.get(
  "/public/advertisements/:id",
  publicControllers.getAdvertisementDetail,
);

router.get("/home/featured-tutors", publicControllers.getFeaturedTutors);
router.get("/home/top-reviews", publicControllers.getTopRatedReviews);
router.get("/home/categories", publicControllers.getCategories);

export const publicRoutes = router;
