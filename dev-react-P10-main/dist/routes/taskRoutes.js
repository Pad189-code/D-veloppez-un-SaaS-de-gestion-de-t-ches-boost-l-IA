"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const commentRoutes_1 = __importDefault(require("./commentRoutes"));
const router = (0, express_1.Router)();
router.post("/", auth_1.authenticateToken, taskController_1.createTask);
router.get("/", auth_1.authenticateToken, taskController_1.getTasks);
router.get("/:taskId", auth_1.authenticateToken, taskController_1.getTask);
router.put("/:taskId", auth_1.authenticateToken, taskController_1.updateTask);
router.delete("/:taskId", auth_1.authenticateToken, taskController_1.deleteTask);
router.use("/:taskId/comments", commentRoutes_1.default);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map