import * as residentService from "../services/resident.service.js";
import catchAsync from "../utils/catchAsync.js";

export const getResidentOverview = catchAsync(async (req, res) => {
  const overview = await residentService.getResidentOverview(req);

  res.status(200).json({
    status: "success",
    data: {
      overview,
    },
  });
});

export const getResidentInvoices = catchAsync(async (req, res) => {
  const invoices = await residentService.getResidentInvoices(req);

  res.status(200).json({
    status: "success",
    data: {
      invoices,
    },
  });
});

