/**
 * Standardized response helpers for OpenAPI compliance -- Claude-4-Sonnet Generated
 */

export const sendSuccess = (res, data, statusCode = 200) => {
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

export const sendCreated = (res, data,) => {
    return sendSuccess(res, data, 201);
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

export const sendConflict = (res, message = 'Resource already exists') => {
    return sendError(res, { name: 'ConflictError', message }, 409);
};

export const sendUnprocessableEntity = (res, message = 'Validation failed') => {
    return sendError(res, { name: 'ValidationError', message }, 422);
};

export const sendTooManyRequests = (res, message = 'Too many requests') => {
    return sendError(res, { name: 'RateLimitError', message }, 429);
};

export const sendPaymentRequired = (res, message = 'Insufficient funds') => {
    return sendError(res, { name: 'InsufficientFundsError', message }, 402);
};

export const sendInternalServerError = (res, message = 'Internal server error') => {
    return sendError(res, { name: 'InternalServerError', message }, 500);
};
