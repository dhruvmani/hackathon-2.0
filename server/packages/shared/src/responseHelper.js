/**
 * Sends a standardized success response.
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Success message.
 * @param {*} data - Response payload.
 */
export function sendSuccess(res, statusCode, message, data = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  res.status(statusCode).json(body);
}

/**
 * Sends a standardized error response.
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Error message.
 */
export function sendError(res, statusCode, message) {
  res.status(statusCode).json({ success: false, error: message });
}

/**
 * Sends a paginated success response.
 * @param {import('express').Response} res
 * @param {*[]} data - Array of items.
 * @param {number} total - Total item count.
 * @param {number} page - Current page number.
 * @param {number} limit - Items per page.
 */
export function sendPaginated(res, data, total, page, limit) {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}
