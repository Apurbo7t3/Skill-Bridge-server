// src/modules/teacher/teacher.controller.ts
import { Request, Response } from "express";
import { teacherServices } from "./teacher.service";

const createAdvertisement = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { subjectId, description, slot, price } = req.body;

    // Basic validation
    if (!subjectId || !description || !slot || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subjectId, description, slot, price",
      });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number",
      });
    }

    const result = await teacherServices.createAdvertisement({
      teacherId,
      subjectId,
      description,
      slot,
      price,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdvertisement = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await teacherServices.getAdvertisement({ teacherId });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyBookedSessions = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const sessions = await teacherServices.getTeacherBookedSessions(teacherId);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const completeBookedSession = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const updated = await teacherServices.completeBookedSession(
      sessionId as string,
      teacherId,
    );

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

const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const stats = await teacherServices.getTeacherDashboardStatsAlt(teacherId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTeacherProfile = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await teacherServices.getTeacherProfile(teacherId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const teacherControllers = {
  createAdvertisement,
  getAdvertisement,
  getMyBookedSessions,
  completeBookedSession,
  getTeacherProfile,
  getDashboardStats,
};
