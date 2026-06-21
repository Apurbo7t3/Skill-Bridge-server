import { Request, Response } from "express";
import { studentServices } from "./student.service";

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

export const studentControllers = {
  bookAdvertisement,
};
