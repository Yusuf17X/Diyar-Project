import AppError from "./appError.js";

export default (fn) => {
  return (req, res, next) => {
    return fn(req, res, next).catch((err) => {
      if (err instanceof Error) {
        next(err);
      } else {
        next(new AppError(err || "An unexpected error occurred", 500));
      }
    });
  };
};
