"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const open_1 = __importDefault(require("open"));
function createTempServer(httpContent) {
    const server = http_1.default.createServer(function (req, res) {
        if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(httpContent);
            res.end();
        }
        else {
            res.writeHead(404);
            res.end('Cannot find');
        }
    });
    return new Promise((res) => {
        server.listen(5000, async () => {
            res(server);
            await open_1.default('http://localhost:5000/');
        });
    });
}
exports.createTempServer = createTempServer;
//# sourceMappingURL=temp-server.js.map