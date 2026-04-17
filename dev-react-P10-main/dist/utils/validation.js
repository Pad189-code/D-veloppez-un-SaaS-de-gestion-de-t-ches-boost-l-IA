"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateCommentData = exports.validateCreateCommentData = exports.validateUpdateTaskData = exports.validateCreateTaskData = exports.validateUpdateProjectData = exports.validateCreateProjectData = exports.validateUpdatePasswordData = exports.validateUpdateProfileData = exports.validateLoginData = exports.validateRegisterData = exports.isValidDate = exports.isValidPassword = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isValidPassword = isValidPassword;
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()) && dateString === date.toISOString();
};
exports.isValidDate = isValidDate;
const validateRegisterData = (data) => {
    const errors = [];
    if (!data.email) {
        errors.push({ field: "email", message: "L'email est requis" });
    }
    else if (!(0, exports.isValidEmail)(data.email)) {
        errors.push({ field: "email", message: "Format d'email invalide" });
    }
    if (!data.password) {
        errors.push({ field: "password", message: "Le mot de passe est requis" });
    }
    else if (!(0, exports.isValidPassword)(data.password)) {
        errors.push({
            field: "password",
            message: "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule et un chiffre",
        });
    }
    if (data.name && data.name.trim().length < 2) {
        errors.push({
            field: "name",
            message: "Le nom doit contenir au moins 2 caractères",
        });
    }
    return errors;
};
exports.validateRegisterData = validateRegisterData;
const validateLoginData = (data) => {
    const errors = [];
    if (!data.email) {
        errors.push({ field: "email", message: "L'email est requis" });
    }
    if (!data.password) {
        errors.push({ field: "password", message: "Le mot de passe est requis" });
    }
    return errors;
};
exports.validateLoginData = validateLoginData;
const validateUpdateProfileData = (data) => {
    const errors = [];
    if (data.email !== undefined) {
        if (!data.email.trim()) {
            errors.push({ field: "email", message: "L'email ne peut pas être vide" });
        }
        else if (!(0, exports.isValidEmail)(data.email)) {
            errors.push({ field: "email", message: "Format d'email invalide" });
        }
    }
    if (data.name !== undefined) {
        if (data.name.trim().length < 2) {
            errors.push({
                field: "name",
                message: "Le nom doit contenir au moins 2 caractères",
            });
        }
    }
    return errors;
};
exports.validateUpdateProfileData = validateUpdateProfileData;
const validateUpdatePasswordData = (data) => {
    const errors = [];
    if (!data.currentPassword) {
        errors.push({
            field: "currentPassword",
            message: "Le mot de passe actuel est requis",
        });
    }
    if (!data.newPassword) {
        errors.push({
            field: "newPassword",
            message: "Le nouveau mot de passe est requis",
        });
    }
    else if (!(0, exports.isValidPassword)(data.newPassword)) {
        errors.push({
            field: "newPassword",
            message: "Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule et un chiffre",
        });
    }
    if (data.currentPassword &&
        data.newPassword &&
        data.currentPassword === data.newPassword) {
        errors.push({
            field: "newPassword",
            message: "Le nouveau mot de passe doit être différent de l'actuel",
        });
    }
    return errors;
};
exports.validateUpdatePasswordData = validateUpdatePasswordData;
const validateCreateProjectData = (data) => {
    const errors = [];
    if (!data.name) {
        errors.push({ field: "name", message: "Le nom du projet est requis" });
    }
    else if (data.name.trim().length < 2) {
        errors.push({
            field: "name",
            message: "Le nom du projet doit contenir au moins 2 caractères",
        });
    }
    else if (data.name.trim().length > 100) {
        errors.push({
            field: "name",
            message: "Le nom du projet ne peut pas dépasser 100 caractères",
        });
    }
    if (data.description && data.description.trim().length > 500) {
        errors.push({
            field: "description",
            message: "La description ne peut pas dépasser 500 caractères",
        });
    }
    if (data.contributors) {
        if (Array.isArray(data.contributors)) {
            data.contributors.forEach((email, index) => {
                if (!(0, exports.isValidEmail)(email)) {
                    errors.push({
                        field: `contributors[${index}]`,
                        message: "Format d'email invalide",
                    });
                }
            });
        }
        else {
            errors.push({
                field: "contributors",
                message: "Les contributeurs doivent être un tableau",
            });
        }
    }
    return errors;
};
exports.validateCreateProjectData = validateCreateProjectData;
const validateUpdateProjectData = (data) => {
    const errors = [];
    if (data.name !== undefined) {
        if (!data.name.trim()) {
            errors.push({
                field: "name",
                message: "Le nom du projet ne peut pas être vide",
            });
        }
        else if (data.name.trim().length < 2) {
            errors.push({
                field: "name",
                message: "Le nom du projet doit contenir au moins 2 caractères",
            });
        }
        else if (data.name.trim().length > 100) {
            errors.push({
                field: "name",
                message: "Le nom du projet ne peut pas dépasser 100 caractères",
            });
        }
    }
    if (data.description !== undefined && data.description.trim().length > 500) {
        errors.push({
            field: "description",
            message: "La description ne peut pas dépasser 500 caractères",
        });
    }
    return errors;
};
exports.validateUpdateProjectData = validateUpdateProjectData;
const validateCreateTaskData = (data) => {
    const errors = [];
    if (!data.title) {
        errors.push({ field: "title", message: "Le titre de la tâche est requis" });
    }
    else if (data.title.trim().length < 2) {
        errors.push({
            field: "title",
            message: "Le titre de la tâche doit contenir au moins 2 caractères",
        });
    }
    else if (data.title.trim().length > 200) {
        errors.push({
            field: "title",
            message: "Le titre de la tâche ne peut pas dépasser 200 caractères",
        });
    }
    if (data.description && data.description.trim().length > 1000) {
        errors.push({
            field: "description",
            message: "La description ne peut pas dépasser 1000 caractères",
        });
    }
    if (data.dueDate && !(0, exports.isValidDate)(data.dueDate)) {
        errors.push({
            field: "dueDate",
            message: "Format de date invalide (utilisez le format ISO)",
        });
    }
    if (data.assigneeIds) {
        if (Array.isArray(data.assigneeIds)) {
            data.assigneeIds.forEach((userId, index) => {
                if (!userId || typeof userId !== "string") {
                    errors.push({
                        field: `assigneeIds[${index}]`,
                        message: "L'ID de l'utilisateur assigné est invalide",
                    });
                }
            });
        }
        else {
            errors.push({
                field: "assigneeIds",
                message: "Les assignations doivent être un tableau",
            });
        }
    }
    return errors;
};
exports.validateCreateTaskData = validateCreateTaskData;
const validateUpdateTitle = (title) => {
    if (!title.trim()) {
        return {
            field: "title",
            message: "Le titre de la tâche ne peut pas être vide",
        };
    }
    if (title.trim().length < 2) {
        return {
            field: "title",
            message: "Le titre de la tâche doit contenir au moins 2 caractères",
        };
    }
    if (title.trim().length > 200) {
        return {
            field: "title",
            message: "Le titre de la tâche ne peut pas dépasser 200 caractères",
        };
    }
    return null;
};
const validateTaskStatus = (status) => {
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
    return validStatuses.includes(status)
        ? null
        : {
            field: "status",
            message: "Le statut doit être TODO, IN_PROGRESS, DONE ou CANCELLED",
        };
};
const validateAssignees = (assigneeIds) => {
    const errors = [];
    if (!Array.isArray(assigneeIds)) {
        errors.push({
            field: "assigneeIds",
            message: "Les assignations doivent être un tableau",
        });
        return errors;
    }
    assigneeIds.forEach((userId, index) => {
        if (!userId || typeof userId !== "string") {
            errors.push({
                field: `assigneeIds[${index}]`,
                message: "L'ID de l'utilisateur assigné est invalide",
            });
        }
    });
    return errors;
};
const validateUpdateTaskData = (data) => {
    const errors = [];
    if (data.title !== undefined) {
        const titleError = validateUpdateTitle(data.title);
        if (titleError)
            errors.push(titleError);
    }
    if (data.description !== undefined && data.description.trim().length > 1000) {
        errors.push({
            field: "description",
            message: "La description ne peut pas dépasser 1000 caractères",
        });
    }
    if (data.status) {
        const statusError = validateTaskStatus(data.status);
        if (statusError)
            errors.push(statusError);
    }
    if (data.dueDate !== undefined &&
        data.dueDate &&
        !(0, exports.isValidDate)(data.dueDate)) {
        errors.push({
            field: "dueDate",
            message: "Format de date invalide (utilisez le format ISO)",
        });
    }
    if (data.assigneeIds !== undefined) {
        errors.push(...validateAssignees(data.assigneeIds));
    }
    return errors;
};
exports.validateUpdateTaskData = validateUpdateTaskData;
const validateCreateCommentData = (data) => {
    const errors = [];
    if (!data.content) {
        errors.push({
            field: "content",
            message: "Le contenu du commentaire est requis",
        });
    }
    else if (data.content.trim().length < 1) {
        errors.push({
            field: "content",
            message: "Le contenu du commentaire ne peut pas être vide",
        });
    }
    else if (data.content.trim().length > 2000) {
        errors.push({
            field: "content",
            message: "Le contenu du commentaire ne peut pas dépasser 2000 caractères",
        });
    }
    return errors;
};
exports.validateCreateCommentData = validateCreateCommentData;
const validateUpdateCommentData = (data) => {
    const errors = [];
    if (data.content !== undefined && data.content !== null) {
        if (data.content.trim().length > 2000) {
            errors.push({
                field: "content",
                message: "Le contenu du commentaire ne peut pas dépasser 2000 caractères",
            });
        }
    }
    return errors;
};
exports.validateUpdateCommentData = validateUpdateCommentData;
//# sourceMappingURL=validation.js.map