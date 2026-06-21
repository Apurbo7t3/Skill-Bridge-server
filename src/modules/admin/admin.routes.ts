import { Router } from "express";
import { adminControllers } from "./admin.controller";
import auth from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.use(auth("ADMIN"));

// User management
router.get("/admin/users", adminControllers.getAllUsers);
router.patch("/admin/users/:userId/ban", adminControllers.toggleUserBan);

// Bookings
router.get("/admin/bookings", adminControllers.getAllBookings);

// Category management
router.get("/admin/categories", adminControllers.getAllCategories);
router.post("/admin/categories", adminControllers.createCategory);
router.patch("/admin/categories/:id", adminControllers.updateCategory);
router.delete("/admin/categories/:id", adminControllers.deleteCategory);

export const adminRoutes = router;
