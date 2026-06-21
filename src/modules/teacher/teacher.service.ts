import { prisma } from "../../lib/prisma"; // adjust import path as needed

const createAdvertisement = async (payload: {
  teacherId: string;
  subjectId: number;
  description: string;
  slot: string;
  price: number;
}) => {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: payload.teacherId },
      select: { role: true },
    });
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    if (teacher.role !== "TEACHER") {
      throw new Error("Only teachers can create advertisements");
    }

    await prisma.category.findUniqueOrThrow({
      where: { id: payload.subjectId },
    });

    const result = await prisma.advertisement.create({
      data: {
        teacher_id: payload.teacherId,
        subject_id: payload.subjectId,
        description: payload.description,
        slot: payload.slot,
        price: payload.price,
        status: "UNBOOKED",
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        subject: true,
      },
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const getAdvertisement = async (payload: { teacherId: string }) => {
  try {
    const result = await prisma.advertisement.findMany({
      where: { teacher_id: payload.teacherId },
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get all booked sessions for a teacher
 */
const getTeacherBookedSessions = async (teacherId: string) => {
  try {
    const sessions = await prisma.boookedSessions.findMany({
      where: { teacher_id: teacherId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
        advertisment: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    return sessions;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Mark a booked session as COMPLETED (teacher only)
 */
const completeBookedSession = async (sessionId: string, teacherId: string) => {
  try {
    // Verify session exists and belongs to this teacher
    const session = await prisma.boookedSessions.findFirst({
      where: {
        id: sessionId,
        teacher_id: teacherId,
      },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new Error("Booked session not found or you are not the teacher");
    }

    if (session.status === "COMPLETED") {
      throw new Error("Session is already completed");
    }

    const updated = await prisma.boookedSessions.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
        advertisment: {
          include: {
            subject: true,
          },
        },
      },
    });
    return updated;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const teacherServices = {
  createAdvertisement,
  getAdvertisement,
  getTeacherBookedSessions,
  completeBookedSession,
};
