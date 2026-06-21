import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

interface AdvertisementFilters {
  search?: string;
  subjectId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  status?: "UNBOOKED" | "BOOKED";
  sortBy: "price" | "rating" | "createdAt";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
  skip: number;
}

const browseAdvertisements = async (filters: AdvertisementFilters) => {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const status = filters.status || "UNBOOKED";
  conditions.push(`a.status = $${paramIndex++}`);
  params.push(status);

  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(`(
      a.description ILIKE $${paramIndex++} OR
      c.name ILIKE $${paramIndex++} OR
      u.name ILIKE $${paramIndex++}
    )`);
    params.push(search, search, search);
  }

  if (filters.subjectId) {
    conditions.push(`a.subject_id = $${paramIndex++}`);
    params.push(filters.subjectId);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`a.price >= $${paramIndex++}`);
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`a.price <= $${paramIndex++}`);
    params.push(filters.maxPrice);
  }

  const havingCondition = filters.minRating
    ? `HAVING COALESCE(AVG(bs.rating), 0) >= $${paramIndex++}`
    : "";
  if (filters.minRating) {
    params.push(filters.minRating);
  }

  // Pagination
  const limit = filters.limit;
  const offset = filters.skip;

  // Sort mapping
  const sortMap: Record<string, string> = {
    price: "a.price",
    rating: "avg_rating",
    createdAt: "a.createdAt",
  };
  const orderBy = sortMap[filters.sortBy] || "a.createdAt";
  const orderDir = filters.sortOrder.toUpperCase();

  // Build the main SQL query using CTE for average rating
  const sql = `
    WITH teacher_avg AS (
      SELECT 
        teacher_id,
        COALESCE(AVG(rating), 0) AS avg_rating
      FROM "BoookedSessions"
      WHERE status = 'COMPLETED' AND rating IS NOT NULL
      GROUP BY teacher_id
    )
    SELECT 
      a.id,
      a.description,
      a.slot,
      a.price,
      a.status,
      a.created_at as "createdAt",
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'image', u.image,
        'avg_rating', COALESCE(t.avg_rating, 0)
      ) AS teacher,
      json_build_object(
        'id', c.id,
        'name', c.name
      ) AS subject,
      COALESCE(t.avg_rating, 0) AS avg_rating
    FROM "Advertisement" a
    JOIN "User" u ON a.teacher_id = u.id
    JOIN "Category" c ON a.subject_id = c.id
    LEFT JOIN teacher_avg t ON u.id = t.teacher_id
    WHERE ${conditions.join(" AND ")}
    ${havingCondition ? `HAVING COALESCE(t.avg_rating, 0) >= $${paramIndex - 1}` : ""}
    ORDER BY ${orderBy} ${orderDir}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  // Execute raw query
  const result = await prisma.$queryRawUnsafe<AdvertisementResult[]>(
    sql,
    ...params,
  );

  // Count total records matching filters (without pagination) for pagination meta
  const countSql = `
    SELECT COUNT(*) AS total
    FROM "Advertisement" a
    JOIN "User" u ON a.teacher_id = u.id
    JOIN "Category" c ON a.subject_id = c.id
    LEFT JOIN (
      SELECT teacher_id, COALESCE(AVG(rating), 0) AS avg_rating
      FROM "BoookedSessions"
      WHERE status = 'COMPLETED' AND rating IS NOT NULL
      GROUP BY teacher_id
    ) t ON u.id = t.teacher_id
    WHERE ${conditions.join(" AND ")}
    ${filters.minRating ? `AND COALESCE(t.avg_rating, 0) >= $${filters.minRating}` : ""}
  `;

  const countResult = await prisma.$queryRawUnsafe<{ total: string }[]>(
    countSql,
    ...params.slice(0, params.length - 2),
  );
  const total = parseInt(countResult[0]?.total || "0");

  return {
    data: result,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

type AdvertisementResult = any;

const getAdvertisementDetail = async (advertisementId: string) => {
  try {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: advertisementId },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!advertisement) {
      throw new Error("Advertisement not found");
    }

    const teacherId = advertisement.teacher_id;

    const ratingAggregate = await prisma.boookedSessions.aggregate({
      where: {
        teacher_id: teacherId,
        status: "COMPLETED",
        rating: { not: null },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = ratingAggregate._avg.rating ?? 0;
    const totalReviews = ratingAggregate._count.rating;

    const reviews = await prisma.boookedSessions.findMany({
      where: {
        teacher_id: teacherId,
        status: "COMPLETED",
        rating: { not: null },
        review: { not: null },
      },
      select: {
        rating: true,
        review: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      advertisement,
      teacher: {
        ...advertisement.teacher,
        averageRating: Number(averageRating.toFixed(2)),
        totalReviews,
      },
      reviews: reviews.map((r) => ({
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt,
        student: r.student,
      })),
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const getFeaturedTutors = async (limit: number = 10) => {
  const sessions = await prisma.boookedSessions.groupBy({
    by: ["teacher_id"],
    where: {
      status: "COMPLETED",
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
    orderBy: {
      _avg: { rating: "desc" },
    },
    take: limit,
  });

  const teacherIds = sessions.map((s) => s.teacher_id);
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: {
      id: true,
      name: true,
      image: true,
      advertisements: {
        select: {
          subject: true,
        },
        distinct: ["subject_id"],
      },
    },
  });

  const result = sessions.map((session) => {
    const teacher = teachers.find((t) => t.id === session.teacher_id);
    return {
      teacherId: session.teacher_id,
      name: teacher?.name || "",
      image: teacher?.image || null,
      subjects: teacher?.advertisements.map((ad) => ad.subject) || [],
      averageRating: Number(session._avg.rating?.toFixed(2) || 0),
      totalReviews: session._count.rating,
    };
  });

  return result;
};

const getTopRatedReviews = async (limit: number = 10) => {
  const sessions = await prisma.boookedSessions.findMany({
    where: {
      status: "COMPLETED",
      rating: { not: null },
      review: { not: null },
    },
    select: {
      rating: true,
      review: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      advertisment: {
        select: {
          subject: true,
        },
      },
    },
    orderBy: {
      rating: "desc",
    },
    take: limit,
  });

  return sessions;
};

const getCategories = async () => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          advertisements: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    totalAdvertisements: cat._count.advertisements,
  }));
};

export const publicServices = {
  browseAdvertisements,
  getAdvertisementDetail,
  getFeaturedTutors,
  getTopRatedReviews,
  getCategories,
};
