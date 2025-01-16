"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/metrics', metrics_1.default);
const port = Number(process.env.PORT) || 3002;
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
//# sourceMappingURL=app.js.map