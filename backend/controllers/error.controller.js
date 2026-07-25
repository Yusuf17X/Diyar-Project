import AppError from "./../utils/appError.js";

// 1. Prisma Duplicate Fields
const handlePrismaDuplicateFieldsDB = (err) => {
  const target = err.meta?.target;
  const fieldName = Array.isArray(target) ? target.join(", ") : "this field";

  const message = `Duplicate value for ${fieldName}. Please use another value!`;
  return new AppError(message, 400);
};

// 2. Prisma Record Not Found
const handlePrismaRecordNotFoundDB = (err) => {
  const cause = err.meta?.cause || "Record not found.";
  const message = `Database Error: ${cause}`;
  return new AppError(message, 404);
};

// 3. Prisma Validation Error
const handlePrismaValidationErrorDB = (err) => {
  const message = `Invalid input data. Please check your data types and missing fields.`;
  return new AppError(message, 400);
};

// 4. JWT Errors
const handleJWTError = () =>
  new AppError("Invalid token, please login again!", 401);

const handleExpiredJWTError = () =>
  new AppError("Expired token, please login again!", 401);

const sendErrorDev = (err, res) => {
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: dont leak error details
  } else {
    // Log the error
    console.error("ERROR 💥", err);

    // Send generic response
    res.status(500).json({
      status: "error",
      message: "Something went wrong on the server!",
    });
  }
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // NOTE: Destructuring 'err' strips prototype properties.
    // We explicitly carry over Prisma specific properties (.code and .meta)
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      code: err.code,
      meta: err.meta,
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational,
    };

    //! PRISMA ERRORS

    // P2002: "Unique constraint failed on the {constraint}"
    if (error.code === "P2002") error = handlePrismaDuplicateFieldsDB(error);

    // P2025: "An operation failed because it depends on one or more records that were required but not found."
    if (error.code === "P2025") error = handlePrismaRecordNotFoundDB(error);

    // Prisma Validation Error
    if (error.name === "PrismaClientValidationError")
      error = handlePrismaValidationErrorDB(error);

    // //! JWT ERROR MAPPING ---
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleExpiredJWTError();

    sendErrorProd(error, res);
  } else {
    sendErrorProd(err, res);
  }
};
