import { Router } from "express";
import { studentControllers } from "./student.controller";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/student/bookings",
  auth(UserRole.STUDENT),
  studentControllers.bookAdvertisement,
);

router.get(
  "/student/bookings",
  auth(UserRole.STUDENT),
  studentControllers.getMyBookedSessions,
);

router.patch(
  "/student/bookings/:sessionId/rating",
  auth(UserRole.STUDENT),
  studentControllers.rateSession,
);

router.get(
  "/student/dashboard",
  auth(UserRole.STUDENT),
  studentControllers.getDashboardStats,
);

router.get(
  "/student/profile",
  auth(UserRole.STUDENT),
  studentControllers.getProfile,
);

export const studentRoutes = router;
