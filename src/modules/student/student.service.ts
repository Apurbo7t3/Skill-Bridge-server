import { prisma } from "../../lib/prisma";

const bookAdvertisement = async (
  studentId: string,
  advertisementId: string,
) => {
  try {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: advertisementId },
      select: {
        id: true,
        status: true,
        teacher_id: true,
        subject_id: true,
      },
    });

    if (!advertisement) {
      throw new Error("Advertisement not found");
    }
    if (advertisement.status === "BOOKED") {
      throw new Error("This advertisement is already booked");
    }

    if (advertisement.teacher_id === studentId) {
      throw new Error("You cannot book your own advertisement");
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    });
    if (!student) {
      throw new Error("Student not found");
    }
    if (student.role !== "STUDENT") {
      throw new Error("Only students can book advertisements");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the booked session
      const bookedSession = await tx.boookedSessions.create({
        data: {
          teacher_id: advertisement.teacher_id,
          student_id: studentId,
          advertisment_id: advertisementId,
          status: "RUNNING",
          rating: null,
          review: null,
        },
      });

      // 2. Update the advertisement status to BOOKED
      await tx.advertisement.update({
        where: { id: advertisementId },
        data: { status: "BOOKED" },
      });

      return bookedSession;
    });

    const fullSession = await prisma.boookedSessions.findUnique({
      where: { id: result.id },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
        advertisment: {
          include: {
            subject: true,
          },
        },
      },
    });

    return fullSession;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const getStudentBookedSessions = async (studentId: string) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    });
    if (!student) {
      throw new Error("Student not found");
    }
    if (student.role !== "STUDENT") {
      throw new Error("Only students can access their bookings");
    }

    const sessions = await prisma.boookedSessions.findMany({
      where: { student_id: studentId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, image: true },
        },
        student: {
          select: { id: true, name: true, email: true, image: true },
        },
        advertisment: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sessions;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const rateAndReviewSession = async (data: {
  sessionId: string;
  studentId: string;
  rating: number;
  review?: string;
}) => {
  try {
    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Fetch the session and verify ownership and status
    const session = await prisma.boookedSessions.findUnique({
      where: { id: data.sessionId },
      select: {
        student_id: true,
        status: true,
        rating: true,
      },
    });

    if (!session) {
      throw new Error("Booked session not found");
    }
    if (session.student_id !== data.studentId) {
      throw new Error("You are not the student for this session");
    }
    if (session.status !== "COMPLETED") {
      throw new Error("You can only rate completed sessions");
    }
    // if (session.rating !== null) {
    //   throw new Error("You have already rated this session");
    // }

    // Update the session with rating and review
    const updatedSession = await prisma.boookedSessions.update({
      where: { id: data.sessionId },
      data: {
        rating: data.rating,
        review: data.review ?? null,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
        advertisment: {
          include: { subject: true },
        },
      },
    });

    return updatedSession;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const getStudentDashboardStats = async (studentId: string) => {
  try {
    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    });
    if (!student) {
      throw new Error("Student not found");
    }
    if (student.role !== "STUDENT") {
      throw new Error("Invalid user role");
    }

    // Total bookings
    const totalBookings = await prisma.boookedSessions.count({
      where: { student_id: studentId },
    });

    // Session counts by status
    const sessionCounts = await prisma.boookedSessions.groupBy({
      by: ["status"],
      where: { student_id: studentId },
      _count: { status: true },
    });

    const counts = { RUNNING: 0, COMPLETED: 0, CANCELED: 0 };
    sessionCounts.forEach((item) => {
      counts[item.status] = item._count.status;
    });

    // Total spent on completed sessions (sum of advertisement prices)
    const completedSessions = await prisma.boookedSessions.findMany({
      where: {
        student_id: studentId,
        status: "COMPLETED",
      },
      select: {
        advertisment: {
          select: { price: true },
        },
      },
    });

    const totalSpent = completedSessions.reduce(
      (sum, session) => sum + session.advertisment.price,
      0,
    );

    // Average rating given by this student (only for sessions where they rated)
    const ratedSessions = await prisma.boookedSessions.findMany({
      where: {
        student_id: studentId,
        rating: { not: null },
      },
      select: { rating: true },
    });

    let averageRatingGiven = 0;
    if (ratedSessions.length > 0) {
      const totalRating = ratedSessions.reduce(
        (sum, s) => sum + (s.rating ?? 0),
        0,
      );
      averageRatingGiven = Number(
        (totalRating / ratedSessions.length).toFixed(2),
      );
    }

    return {
      totalBookings,
      sessionCounts: counts,
      totalSpent,
      averageRatingGiven,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const getStudentProfile = async (studentId: string) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!student) {
      throw new Error("Student not found");
    }

    // Average rating given
    const ratedSessions = await prisma.boookedSessions.findMany({
      where: {
        student_id: studentId,
        rating: { not: null },
      },
      select: { rating: true },
    });

    let averageRatingGiven = 0;
    if (ratedSessions.length > 0) {
      const totalRating = ratedSessions.reduce(
        (sum, s) => sum + (s.rating ?? 0),
        0,
      );
      averageRatingGiven = Number(
        (totalRating / ratedSessions.length).toFixed(2),
      );
    }

    return {
      ...student,
      averageRatingGiven,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const studentServices = {
  bookAdvertisement,
  getStudentBookedSessions,
  rateAndReviewSession,
  getStudentDashboardStats,
  getStudentProfile,
};
