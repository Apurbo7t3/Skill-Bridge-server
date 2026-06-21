import { Request, Response } from "express";
import { studentServices } from "./student.service";
import { string } from "better-auth/*";

const bookAdvertisement = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { advertisementId } = req.body;
    if (!advertisementId) {
      return res.status(400).json({
        success: false,
        message: "Advertisement ID is required",
      });
    }

    const bookedSession = await studentServices.bookAdvertisement(
      studentId,
      advertisementId,
    );

    res.status(201).json({
      success: true,
      data: bookedSession,
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
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const sessions = await studentServices.getStudentBookedSessions(studentId);

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

const rateSession = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { sessionId } = req.params;
    const { rating, review } = req.body;

    if (!sessionId || typeof sessionId != "string") {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }
    if (rating === undefined || typeof rating !== "number") {
      return res.status(400).json({
        success: false,
        message: "Rating is required and must be a number",
      });
    }

    const updated = await studentServices.rateAndReviewSession({
      sessionId,
      studentId,
      rating,
      review: review ?? undefined, // allow optional review
    });

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
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const stats = await studentServices.getStudentDashboardStats(studentId);

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

const getProfile = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await studentServices.getStudentProfile(studentId);

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

export const studentControllers = {
  bookAdvertisement,
  getMyBookedSessions,
  rateSession,
  getDashboardStats,
  getProfile,
};
