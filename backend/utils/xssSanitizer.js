import xss from "xss";

/* *
 * Recursively cleans strings, arrays, and objects using the 'xss' library.
 */
const clean = (data) => {
  // If its a string sanitize it
  if (typeof data === "string") {
    return xss(data);
  }

  // If its an object or array recursively check its properties
  if (typeof data === "object" && data !== null) {
    for (const key in data) {
      data[key] = clean(data[key]);
    }
  }

  return data;
};

/* *
 * Express middleware to sanitize req.body, req.query, and req.params
 */
const xssSanitizer = () => {
  return (req, res, next) => {
    if (req.body) req.body = clean(req.body);
    if (req.query) req.query = clean(req.query);
    if (req.params) req.params = clean(req.params);
    next();
  };
};

export default xssSanitizer;
