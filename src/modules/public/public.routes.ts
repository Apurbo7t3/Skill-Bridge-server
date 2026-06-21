import { Router } from "express";
import { publicControllers } from "./public.controller";

const router = Router();

router.get("/public/advertisements", publicControllers.browseAdvertisements);
router.get(
  "/public/advertisements/:id",
  publicControllers.getAdvertisementDetail,
);

export const publicRoutes = router;
