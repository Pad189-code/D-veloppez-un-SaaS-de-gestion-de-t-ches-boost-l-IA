"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.ProjectRole = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["CONTRIBUTOR"] = "CONTRIBUTOR";
})(Role || (exports.Role = Role = {}));
var ProjectRole;
(function (ProjectRole) {
    ProjectRole["OWNER"] = "OWNER";
    ProjectRole["ADMIN"] = "ADMIN";
    ProjectRole["CONTRIBUTOR"] = "CONTRIBUTOR";
})(ProjectRole || (exports.ProjectRole = ProjectRole = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
//# sourceMappingURL=index.js.map