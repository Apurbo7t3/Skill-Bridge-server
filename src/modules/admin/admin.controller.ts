import { Request, Response } from "express";
import { adminServices } from "./admin.service";

// ---------- User Management ----------

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminServices.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleUserBan = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId != "string") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const updated = await adminServices.toggleUserBan(userId);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Bookings ----------

const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await adminServices.getAllBookings();
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Category Management ----------

const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await adminServices.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }
    const category = await adminServices.createCategory(name);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: "Category ID and name are required",
      });
    }
    const categoryId = parseInt(id as string);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }
    const updated = await adminServices.updateCategory(categoryId, name);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }
    const deleted = await adminServices.deleteCategory(categoryId);
    res.status(200).json({
      success: true,
      data: deleted,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminControllers = {
  getAllUsers,
  toggleUserBan,
  getAllBookings,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
