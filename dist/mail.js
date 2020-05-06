"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
function list2HTML(lists) {
    const result = Object.entries(lists)
        .reduce((prev, curr) => {
        prev.push(`--${curr[0]}--<br/><ul>`);
        curr[1].forEach(name => prev.push(`<li>${name}</li>`));
        prev.push('</ul>');
        return prev;
    }, []);
    return result.join('');
}
exports.list2HTML = list2HTML;
function sendMail({ auth, html, to, cc, subject }) {
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        tls: { ciphers: 'SSLv3' },
        auth,
    });
    return transporter.sendMail({
        cc,
        html,
        from: auth.user,
        to,
        subject
    });
}
exports.sendMail = sendMail;
//# sourceMappingURL=mail.js.map