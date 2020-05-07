"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const open_1 = __importDefault(require("open"));
const input_html_1 = require("./htmlFile/input.html");
function createTempServer(httpContent, update) {
    const server = http_1.default.createServer(function (req, res) {
        var _a;
        if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(input_html_1.appendingJS(httpContent));
            res.end();
        }
        else if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/api/update')) {
            const raw = [];
            req.on('data', (data) => {
                raw.push(data);
            });
            req.on('end', () => {
                var _a;
                const data = raw.join('');
                console.log(data);
                try {
                    const payload = JSON.parse(data);
                    (_a = update) === null || _a === void 0 ? void 0 : _a(payload.content);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify(payload));
                    res.end();
                }
                catch (error) {
                    console.error(error);
                    res.writeHead(500);
                    res.end();
                }
            });
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