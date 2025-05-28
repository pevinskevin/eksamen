/**
 * Standardized response helpers for OpenAPI compliance
 */

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json(data);
};

export const sendError = (res, error, statusCode = 500) => {
    const errorResponse = {
        error: typeof error === 'string' ? error : error.message || 'An error occurred',
    };

    if (error.details) {
        errorResponse.details = error.details;
    }

    return res.status(statusCode).json(errorResponse);
};

export const sendCreated = (res, data, message = 'Created successfully') => {
    return sendSuccess(res, data, message, 201);
};

export const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

export const sendBadRequest = (res, message = 'Bad request') => {
    return sendError(res, message, 400);
};

export const sendUnauthorized = (res, message = 'Unauthorized') => {
    return sendError(res, message, 401);
};

export const sendForbidden = (res, message = 'Forbidden') => {
    return sendError(res, message, 403);
};
