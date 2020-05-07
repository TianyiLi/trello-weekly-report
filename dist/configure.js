"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const mail_1 = require("./mail");
const trelloService_1 = require("./trelloService");
const fs_1 = require("fs");
async function configure(config) {
    var _a;
    let result = await inquirer_1.default.prompt([
        {
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_USER); },
            message: 'Your office 365 email account?',
            type: 'input',
            name: 'MAIL_USER',
        },
        {
            message: 'Password',
            type: 'password',
            name: 'MAIL_PASSWORD',
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_PASSWORD); },
        },
        {
            message: 'Send to?',
            type: 'input',
            name: 'MAIL_TO',
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_TO); },
        },
        {
            message: 'Has CC?',
            type: 'confirm',
            name: 'hasCC',
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_CC); },
        },
        {
            when(v) {
                var _a;
                return v.hasCC && !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_CC);
            },
            message: 'CC to ?(Comma separated list)',
            type: 'input',
            name: 'MAIL_CC',
        },
        {
            message: 'Mail Subject?',
            type: 'input',
            name: 'MAIL_SUBJECT',
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_SUBJECT); },
        },
        {
            message: `Has signatureFile?${((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_SIGNATURE_FILE) && !fs_1.existsSync(config.MAIL_SIGNATURE_FILE) ? '(file does not exist)' : ''}`,
            type: 'confirm',
            name: 'hasSignature',
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_SIGNATURE_FILE) || !fs_1.existsSync(config.MAIL_SIGNATURE_FILE); },
        },
        {
            when(v) {
                var _a;
                return v.hasSignature && !((_a = config) === null || _a === void 0 ? void 0 : _a.MAIL_SIGNATURE_FILE);
            },
            message: 'Signature file position',
            type: 'input',
            name: 'MAIL_SIGNATURE_FILE',
        },
        {
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.TRELLO_KEY); },
            message: 'Trello key, You can get it from https://trello.com/app-key',
            type: 'input',
            name: 'TRELLO_KEY',
        },
        {
            when: () => { var _a; return !((_a = config) === null || _a === void 0 ? void 0 : _a.TRELLO_TOKEN); },
            message: 'Trello Token, You can get it from https://trello.com/app-key',
            type: 'input',
            name: 'TRELLO_TOKEN',
        },
    ]);
    result = Object.assign(Object.assign({}, config), result);
    console.log('Do the validation with mail, please wait');
    await mail_1.sendMail({
        auth: { user: result.MAIL_USER, pass: result.MAIL_PASSWORD },
        subject: 'Cli test',
        to: result.MAIL_USER,
        html: 'This is the test mail',
    }).catch((err) => {
        console.error(err);
        throw new Error('Email test got error');
    });
    console.log('Do the trello key and token validation, please wait');
    const service = new trelloService_1.TrelloService({
        key: result.TRELLO_KEY,
        token: result.TRELLO_TOKEN,
    });
    await service.getPersonalId();
    console.log('Configure complete');
    return result;
}
exports.configure = configure;
//# sourceMappingURL=configure.js.map