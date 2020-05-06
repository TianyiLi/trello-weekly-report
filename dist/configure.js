"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const trelloService_1 = require("./trelloService");
async function configure() {
    const result = await inquirer_1.default.prompt([
        {
            message: 'Your office 365 email account?',
            type: 'input',
            name: 'MAIL_USER',
        },
        { message: 'Password', type: 'password', name: 'MAIL_PASSWORD' },
        { message: 'Send to?', type: 'input', name: 'MAIL_TO' },
        { message: 'Has CC?', type: 'confirm', name: 'hasCC' },
        {
            when(v) {
                return v.hasCC;
            },
            message: 'CC to ?(Comma separated list)',
            type: 'input',
            name: 'MAIL_CC',
        },
        { message: 'Mail Subject?', type: 'input', name: 'MAIL_SUBJECT' },
        { message: 'Has signatureFile?', type: 'confirm', name: 'hasSignature' },
        {
            when(v) {
                return v.hasSignature;
            },
            message: 'Signature file position',
            type: 'input',
            name: 'MAIL_SIGNATURE_FILE',
        },
        {
            message: 'Trello key, You can get it from https://trello.com/app-key',
            type: 'input',
            name: 'TRELLO_KEY',
        },
        {
            message: 'Trello Token, You can get it from https://trello.com/app-key',
            type: 'input',
            name: 'TRELLO_TOKEN',
        },
    ]);
    // console.log('Do the validation with mail, please wait')
    // await sendMail({
    //   auth: { user: result.MAIL_USER, pass: result.MAIL_PASSWORD },
    //   subject: 'Cli test',
    //   to: result.MAIL_USER,
    //   html: 'This is the test mail',
    // })
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