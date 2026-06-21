import { prisma } from "../../lib/prisma";

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      isBanned: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          advertisements: true,
          taughtSessions: true,
          attendedSessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const toggleUserBan = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned },
    select: {
      id: true,
      name: true,
      email: true,
      isBanned: true,
    },
  });
  return updated;
};

const getAllBookings = async () => {
  return await prisma.boookedSessions.findMany({
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
    orderBy: { createdAt: "desc" },
  });
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    include: {
      _count: {
        select: { advertisements: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

const createCategory = async (name: string) => {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    throw new Error("Category already exists");
  }
  return await prisma.category.create({
    data: { name },
  });
};

const updateCategory = async (categoryId: number, name: string) => {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existing) {
    throw new Error("Category not found");
  }
  const duplicate = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      id: { not: categoryId },
    },
  });
  if (duplicate) {
    throw new Error("Category name already taken");
  }
  return await prisma.category.update({
    where: { id: categoryId },
    data: { name },
  });
};

const deleteCategory = async (categoryId: number) => {
  const adsCount = await prisma.advertisement.count({
    where: { subject_id: categoryId },
  });
  if (adsCount > 0) {
    throw new Error(
      `Cannot delete category: it has ${adsCount} advertisements. Remove or reassign them first.`,
    );
  }
  return await prisma.category.delete({
    where: { id: categoryId },
  });
};

export const adminServices = {
  getAllUsers,
  toggleUserBan,
  getAllBookings,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
