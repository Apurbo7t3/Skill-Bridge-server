import { Request, Response } from "express";
import { publicServices } from "./public.service";
import { getPaginationAndSort } from "../../utils/paginationHelper";

const browseAdvertisements = async (req: Request, res: Response) => {
  try {
    const { search, subjectId, minPrice, maxPrice, minRating, status } =
      req.query;

    const { page, limit, skip, sortBy, sortOrder } = getPaginationAndSort(
      req.query,
    );

    // Parse numeric filters
    const parsedSubjectId = subjectId
      ? parseInt(subjectId as string)
      : undefined;
    const parsedMinPrice = minPrice
      ? parseFloat(minPrice as string)
      : undefined;
    const parsedMaxPrice = maxPrice
      ? parseFloat(maxPrice as string)
      : undefined;
    const parsedMinRating = minRating
      ? parseFloat(minRating as string)
      : undefined;

    // Validate rating range
    if (
      parsedMinRating !== undefined &&
      (parsedMinRating < 0 || parsedMinRating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "minRating must be between 0 and 5",
      });
    }

    const filters: any = {
      search: search as string,
      sortBy: sortBy as "price" | "rating" | "createdAt",
      sortOrder: sortOrder as "asc" | "desc",
      page,
      limit,
      skip,
      ...(parsedSubjectId !== undefined && { subjectId: parsedSubjectId }),
      ...(parsedMinPrice !== undefined && { minPrice: parsedMinPrice }),
      ...(parsedMaxPrice !== undefined && { maxPrice: parsedMaxPrice }),
      ...(parsedMinRating !== undefined && { minRating: parsedMinRating }),
      ...(status && { status: status as "UNBOOKED" | "BOOKED" }),
    };

    const result = await publicServices.browseAdvertisements(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdvertisementDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id != "string") {
      return res.status(400).json({
        success: false,
        message: "Advertisement ID is required",
      });
    }

    const detail = await publicServices.getAdvertisementDetail(id);

    res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const publicControllers = {
  browseAdvertisements,
  getAdvertisementDetail,
};
