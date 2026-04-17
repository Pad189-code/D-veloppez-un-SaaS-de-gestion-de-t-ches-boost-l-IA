"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAuthError = exports.sendServerError = exports.sendValidationError = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, message, data, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, error, statusCode = 400) => {
    const response = {
        success: false,
        message,
        error,
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendValidationError = (res, message, errors) => {
    const response = {
        success: false,
        message,
        error: "Validation failed",
        data: { errors },
    };
    res.status(400).json(response);
};
exports.sendValidationError = sendValidationError;
const sendServerError = (res, message = "Erreur interne du serveur", error) => {
    (0, exports.sendError)(res, message, error, 500);
};
exports.sendServerError = sendServerError;
const sendAuthError = (res, message = "Non autorisé") => {
    (0, exports.sendError)(res, message, "Authentication failed", 401);
};
exports.sendAuthError = sendAuthError;
//# sourceMappingURL=response.js.map