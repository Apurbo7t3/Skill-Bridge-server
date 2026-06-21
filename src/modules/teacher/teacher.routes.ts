import { Router } from "express";
import { teacherControllers } from "./teacher.controller";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/advertisements",
  auth(UserRole.TEACHER),
  teacherControllers.createAdvertisement,
);

router.get(
  "/teacher/sessions",
  auth(UserRole.TEACHER),
  teacherControllers.getMyBookedSessions,
);

router.patch(
  "/teacher/sessions/:sessionId/complete",
  auth(UserRole.TEACHER),
  teacherControllers.completeBookedSession,
);

router.get(
  "/teacher/dashboard",
  auth(UserRole.TEACHER),
  teacherControllers.getDashboardStats,
);

router.get(
  "/teacher/profile",
  auth(UserRole.TEACHER),
  teacherControllers.getTeacherProfile,
);

export const teacherRoutes = router;
