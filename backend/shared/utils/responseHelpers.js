/**
 * Standardized response helpers for OpenAPI compliance
 */

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json(data);
};

export const sendError = (res, error, statusCode = 500) => {
    const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';

    const errorResponse = {
        error: typeof error === 'object' && error.name ? error.name : 'ServerError',
        message: errorMessage,
    };

    return res.status(statusCode).json(errorResponse);
};

export const sendCreated = (res, data, message = 'Created successfully') => {
    return sendSuccess(res, data, message, 201);
};

export const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, { name: 'NotFoundError', message: `${resource} not found` }, 404);
};

export const sendBadRequest = (res, message = 'Bad request') => {
    return sendError(res, { name: 'ValidationError', message }, 400);
};

export const sendUnauthorized = (res, message = 'Unauthorized') => {
    return sendError(res, { name: 'AuthenticationError', message }, 401);
};

export const sendForbidden = (res, message = 'Forbidden') => {
    return sendError(res, { name: 'AuthorizationError', message }, 403);
};
