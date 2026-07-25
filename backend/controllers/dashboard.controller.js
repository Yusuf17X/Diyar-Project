import * as dashboardService from "../services/dashboard.service.js";
import catchAsync from "../utils/catchAsync.js";

export const attachScope = (req, res, next) => {
  req.scopeFilter =
    req.user.role === "SUPER_ADMIN" ? {} : { propertyId: req.user.propertyId };

  next();
};

export const getSummary = catchAsync(async (req, res, next) => {
  const summary = await dashboardService.getSummary(req.scopeFilter);

  res.status(200).json({
    status: "success",
    data: summary,
  });
});

export const getBillingSummary = catchAsync(async (req, res, next) => {
  const summary = await dashboardService.getBillingSummary(req.scopeFilter);

  res.status(200).json({
    status: "success",
    data: summary,
  });
});

export const getMaintenanceTrends = catchAsync(async (req, res, next) => {
  const trends = await dashboardService.getMaintenanceTrends(req.scopeFilter);

  res.status(200).json({
    status: "success",
    data: trends,
  });
});

