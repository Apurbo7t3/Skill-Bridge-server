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

export const studentServices = {
  bookAdvertisement,
};
