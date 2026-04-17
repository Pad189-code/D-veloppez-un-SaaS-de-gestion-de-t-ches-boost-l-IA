"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post("/", commentController_1.createComment);
router.get("/", commentController_1.getComments);
router.get("/:commentId", commentController_1.getComment);
router.put("/:commentId", commentController_1.updateComment);
router.delete("/:commentId", commentController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=commentRoutes.js.map