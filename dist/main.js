"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const minimist_1 = __importDefault(require("minimist"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const query_string_1 = require("query-string");
const didyoumean_1 = __importDefault(require("didyoumean"));
const mail_1 = require("./mail");
const fs_1 = require("fs");
const date_fns_1 = require("date-fns");
const cli_table2_1 = __importDefault(require("cli-table2"));
const arg = minimist_1.default(process.argv.slice(2));
const baseURL = 'https://api.trello.com';
const req = axios_1.default.create({
    baseURL: baseURL,
});
var Trello;
(function (Trello) {
    const defaultValue = {
        boardName: '',
        listName: ['This Week', 'Next Week'],
    };
})(Trello || (Trello = {}));
function validateFile(config) {
    const empty = Object.entries(config).filter((ele) => ele[1] === '');
    if (empty.length === 0)
        return false;
    const allow = empty
        .map((ele) => ele[0])
        .every((ele) => [
        'TARGET_BOARD_NAME',
        'TARGET_FROM_LIST_NAME',
        'TARGET_TO_LIST_NAME',
        'MAIL_CC',
        'MAIL_SIGNATURE_FILE'
    ].includes(ele));
    console.log(empty);
    return allow;
}
async function doStuff(config, useConfig = false) {
    var _a, _b;
    const auth = { key: config.TRELLO_KEY, token: config.TRELLO_TOKEN };
    const { id: personId } = await req
        .get(`/1/members/me/?${query_string_1.stringify(Object.assign(Object.assign({}, auth), { fields: 'id' }))}`)
        .then((res) => res.data, (err) => (console.error(err), { id: '-1' }));
    if (personId === '-1')
        process.exit(1);
    const boards = await req
        .get(`/1/members/me/boards?${query_string_1.stringify(Object.assign(Object.assign({}, auth), { fields: 'name' }))}`)
        .then((res) => res.data);
    if (config.TARGET_BOARD_NAME === '') {
        config.TARGET_BOARD_NAME = (await inquirer_1.default.prompt({
            message: 'Which board do you want to?',
            default: boards[0].name,
            type: 'list',
            name: 'name',
            choices: boards.map((ele) => ele.name),
        })).name;
    }
    const board = boards.find((ele) => ele.name === config.TARGET_BOARD_NAME);
    if (!board)
        throw new Error(`cannot find ${config.TARGET_BOARD_NAME} in the list`);
    const list = await req
        .get(`/1/boards/${board.id}/lists?${query_string_1.stringify(Object.assign(Object.assign({}, auth), { fields: 'name' }))}`)
        .then((res) => res.data);
    // This week
    if (!config.THIS_WEEK_LIST_NAME) {
        const thisWeek = (await inquirer_1.default.prompt({
            message: 'Which list you want to set to this week?',
            default: list[0].name,
            type: 'list',
            name: 'thisWeek',
            choices: list.map((ele) => ele.name),
        })).thisWeek;
        config.THIS_WEEK_LIST_NAME = thisWeek;
    }
    else {
        let thisWeek = (_a = list.find((ele) => ele.name === config.THIS_WEEK_LIST_NAME)) === null || _a === void 0 ? void 0 : _a.name;
        if (thisWeek) {
            config.THIS_WEEK_LIST_NAME = thisWeek;
        }
        else {
            const mean = didyoumean_1.default(config.THIS_WEEK_LIST_NAME, list, 'id');
            if (!mean)
                throw new Error(`Cannot find any name like ${config.THIS_WEEK_LIST_NAME}!`);
            const nameIsCorrect = await inquirer_1.default
                .prompt({
                message: `Cannot find ${config.THIS_WEEK_LIST_NAME} did you mean ${mean}?`,
                type: 'confirm',
                default: true,
                name: 'nameIsTrue',
            })
                .then((res) => res.nameIsTrue);
            if (!nameIsCorrect) {
                throw new Error(`Cannot find the list name called ${config.THIS_WEEK_LIST_NAME}`);
            }
            config.THIS_WEEK_LIST_NAME = mean;
        }
    }
    // Next Week
    if (!config.NEXT_WEEK_LIST_NAME) {
        const nextWeek = (await inquirer_1.default.prompt({
            message: 'Which list you want to set to this week?',
            default: list[0].name,
            type: 'list',
            name: 'nextWeek',
            choices: list.map((ele) => ele.name),
        })).nextWeek;
        config.NEXT_WEEK_LIST_NAME = nextWeek;
    }
    else {
        let nextWeek = (_b = list.find((ele) => ele.name === config.NEXT_WEEK_LIST_NAME)) === null || _b === void 0 ? void 0 : _b.name;
        if (nextWeek) {
            config.NEXT_WEEK_LIST_NAME = nextWeek;
        }
        else {
            const mean = didyoumean_1.default(config.NEXT_WEEK_LIST_NAME, list, 'id');
            if (!mean)
                throw new Error(`Cannot find any name like ${config.NEXT_WEEK_LIST_NAME}!`);
            const nameIsCorrect = await inquirer_1.default
                .prompt({
                message: `Cannot find ${config.NEXT_WEEK_LIST_NAME} to did you mean ${mean}?`,
                type: 'confirm',
                default: true,
                name: 'nameIsTrue',
            })
                .then((res) => res.nameIsTrue);
            if (!nameIsCorrect) {
                throw new Error(`Cannot find the list name called ${config.NEXT_WEEK_LIST_NAME}`);
            }
            config.NEXT_WEEK_LIST_NAME = mean;
        }
    }
    // assemble
    const thisWeekId = list.find((ele) => ele.name === config.THIS_WEEK_LIST_NAME).id;
    const nextWeekId = list.find((ele) => ele.name === config.NEXT_WEEK_LIST_NAME).id;
    const thisWeekList = await req
        .get(`/1/lists/${thisWeekId}/cards?${query_string_1.stringify(Object.assign(Object.assign({}, auth), { fields: 'name,idMembers' }))}`)
        .then((res) => res.data)
        .then((data) => data.filter((ele) => ele.idMembers.includes(personId)));
    const nextWeekList = await req
        .get(`/1/list/${nextWeekId}/cards?${query_string_1.stringify(Object.assign(Object.assign({}, auth), { fields: 'name,idMembers' }))}`)
        .then((res) => res.data)
        .then((data) => data.filter((ele) => ele.idMembers.includes(personId)));
    const mailContent = mail_1.list2HTML({
        ['Next Week']: nextWeekList.map((ele) => ele.name),
        ['This Week']: thisWeekList.map((ele) => ele.name),
    });
    console.log(`Prepare the email content...`);
    const cliTable = new cli_table2_1.default({
        head: [
            `This week: ${config.THIS_WEEK_LIST_NAME}`,
            `Next Week ${config.NEXT_WEEK_LIST_NAME}`,
        ],
    });
    Array.from({ length: Math.max(thisWeekList.length, nextWeekList.length) }, (_, i) => {
        var _a, _b;
        return cliTable.push([
            ((_a = thisWeekList[i]) === null || _a === void 0 ? void 0 : _a.name) || '',
            ((_b = nextWeekList[i]) === null || _b === void 0 ? void 0 : _b.name) || '',
        ]);
    });
    console.log(cliTable.toString());
    const confirm = await inquirer_1.default
        .prompt({
        message: 'Confirm to send?',
        type: 'confirm',
        name: 'confirm',
        default: true,
    })
        .then((res) => res.confirm);
    if (!confirm)
        process.exit(0);
    const signatureFile = fs_1.existsSync(config.MAIL_SIGNATURE_FILE)
        ? fs_1.readFileSync(config.MAIL_SIGNATURE_FILE, { encoding: 'utf8' })
        : '';
    await mail_1.sendMail({
        auth: { user: config.MAIL_USER, pass: config.MAIL_PASSWORD },
        cc: config.MAIL_CC,
        html: `${mailContent}<br />${signatureFile}`,
        subject: `[${date_fns_1.format(new Date(), 'MMdd')}]${config.MAIL_SUBJECT}`,
        to: config.MAIL_TO,
    }).catch(console.error);
}
async function MainProcess(config) {
    const { useConfig } = config
        ? await inquirer_1.default.prompt({
            message: 'Use Default Config',
            default: true,
            type: 'confirm',
            name: 'useConfig',
        })
        : { useConfig: false };
    if (useConfig && config) {
        await doStuff(config);
    }
}
const config = (dotenv_1.default.config({ path: arg.file }).parsed ||
    dotenv_1.default.config().parsed);
if (!config) {
    throw new Error('Config file does not exist');
}
if (!validateFile(config)) {
    throw new Error('Config file get error!');
}
MainProcess(config);
//# sourceMappingURL=main.js.map