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

export default router;
