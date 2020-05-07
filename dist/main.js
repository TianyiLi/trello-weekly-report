"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const minimist_1 = __importDefault(require("minimist"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const didyoumean_1 = __importDefault(require("didyoumean"));
const mail_1 = require("./mail");
const fs_1 = require("fs");
const path_1 = require("path");
const date_fns_1 = require("date-fns");
const cli_table2_1 = __importDefault(require("cli-table2"));
const os_1 = require("os");
const trelloService_1 = require("./trelloService");
const configure_1 = require("./configure");
const temp_server_1 = require("./temp-server");
const arg = minimist_1.default(process.argv.slice(2));
const baseURL = 'https://api.trello.com';
const req = axios_1.default.create({
    baseURL: baseURL,
});
function validateFile(config) {
    const empty = Object.entries(config).filter((ele) => ele[1] === '');
    if (empty.length === 0)
        return true;
    console.log(empty);
    const allow = empty
        .map((ele) => ele[0])
        .every((ele) => [
        'TARGET_BOARD_NAME',
        'TARGET_FROM_LIST_NAME',
        'TARGET_TO_LIST_NAME',
        'MAIL_CC',
        'MAIL_SIGNATURE_FILE',
    ].includes(ele));
    return allow;
}
async function doStuff(config, useConfig = false) {
    var _a, _b;
    const auth = { key: config.TRELLO_KEY, token: config.TRELLO_TOKEN };
    const service = new trelloService_1.TrelloService(auth);
    const { id: personId } = await service.getPersonalId();
    if (personId === '-1')
        process.exit(1);
    const boards = await service.getBoards();
    if (!config.TARGET_BOARD_NAME) {
        config.TARGET_BOARD_NAME = (await inquirer_1.default.prompt({
            message: 'Which board do you want to?',
            default: boards[0].name,
            type: 'list',
            name: 'name',
            choices: boards.map((ele) => ele.name),
        })).name;
    }
    let board = boards.find((ele) => ele.name === config.TARGET_BOARD_NAME);
    if (!board) {
        const boardName = didyoumean_1.default(config.TARGET_BOARD_NAME, boards.map((ele) => ele.name));
        if (!boardName) {
            throw new Error(`cannot find ${config.TARGET_BOARD_NAME} in the list`);
        }
        const useMeanBoardName = await inquirer_1.default
            .prompt({
            message: `Cannot find "${config.TARGET_BOARD_NAME}" from config, did you mean "${boardName}"`,
            type: 'confirm',
            name: 'boardName',
        })
            .then((res) => res.boardName);
        if (!useMeanBoardName)
            throw new Error(`Cannot find ${config.TARGET_BOARD_NAME}`);
        config.TARGET_BOARD_NAME = boardName;
        board = boards.find((ele) => ele.name === config.TARGET_BOARD_NAME);
    }
    const lists = await service.getListInBoard(board);
    // This week
    if (!config.THIS_WEEK_LIST_NAME) {
        const thisWeek = (await inquirer_1.default.prompt({
            message: 'Which list you want to set to this week?',
            default: lists[0].name,
            type: 'list',
            name: 'thisWeek',
            choices: lists.map((ele) => ele.name),
        })).thisWeek;
        config.THIS_WEEK_LIST_NAME = thisWeek;
    }
    else {
        let thisWeek = (_a = lists.find((ele) => ele.name === config.THIS_WEEK_LIST_NAME)) === null || _a === void 0 ? void 0 : _a.name;
        if (thisWeek) {
            config.THIS_WEEK_LIST_NAME = thisWeek;
        }
        else {
            const mean = didyoumean_1.default(config.THIS_WEEK_LIST_NAME, lists, 'id');
            if (!mean)
                throw new Error(`Cannot find any name like ${config.THIS_WEEK_LIST_NAME}!`);
            const nameIsCorrect = await inquirer_1.default
                .prompt({
                message: `Cannot find "${config.THIS_WEEK_LIST_NAME}" did you mean "${mean}"?`,
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
            default: lists[0].name,
            type: 'list',
            name: 'nextWeek',
            choices: lists.map((ele) => ele.name),
        })).nextWeek;
        config.NEXT_WEEK_LIST_NAME = nextWeek;
    }
    else {
        let nextWeek = (_b = lists.find((ele) => ele.name === config.NEXT_WEEK_LIST_NAME)) === null || _b === void 0 ? void 0 : _b.name;
        if (nextWeek) {
            config.NEXT_WEEK_LIST_NAME = nextWeek;
        }
        else {
            const mean = didyoumean_1.default(config.NEXT_WEEK_LIST_NAME, lists, 'id');
            if (!mean)
                throw new Error(`Cannot find any name like ${config.NEXT_WEEK_LIST_NAME}!`);
            const nameIsCorrect = await inquirer_1.default
                .prompt({
                message: `Cannot find "${config.NEXT_WEEK_LIST_NAME}" to did you mean "${mean}"?`,
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
    const thisWeekId = lists.find((ele) => ele.name === config.THIS_WEEK_LIST_NAME).id;
    const nextWeekId = lists.find((ele) => ele.name === config.NEXT_WEEK_LIST_NAME).id;
    const thisWeekList = await service
        .getList(thisWeekId)
        .then((data) => data.filter((ele) => ele.idMembers.includes(personId)));
    const nextWeekList = await service
        .getList(nextWeekId)
        .then((data) => data.filter((ele) => ele.idMembers.includes(personId)));
    const listContent = mail_1.list2HTML({
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
    const signatureFile = fs_1.existsSync(config.MAIL_SIGNATURE_FILE)
        ? fs_1.readFileSync(config.MAIL_SIGNATURE_FILE, { encoding: 'utf8' })
        : '';
    const mailContent = `${listContent}<br />${signatureFile}`;
    const server = await temp_server_1.createTempServer(mailContent);
    const confirm = await inquirer_1.default
        .prompt({
        message: 'Confirm to send?',
        type: 'confirm',
        name: 'confirm',
        default: true,
    })
        .then((res) => res.confirm);
    server.close();
    if (!confirm)
        process.exit(0);
    await mail_1.sendMail({
        auth: { user: config.MAIL_USER, pass: config.MAIL_PASSWORD },
        cc: config.MAIL_CC,
        html: mailContent,
        subject: `[${date_fns_1.format(new Date(), 'MMdd')}]${config.MAIL_SUBJECT}`,
        to: config.MAIL_TO,
    }).catch(console.error);
    console.log('Success!');
    const moveToFinish = await inquirer_1.default
        .prompt({
        message: 'Move to finish list?',
        type: 'confirm',
        name: 'toFinish',
    })
        .then((res) => res.toFinish);
    if (moveToFinish) {
        const finishName = await inquirer_1.default
            .prompt({
            message: 'Which list set to finish?',
            type: 'list',
            choices: lists.map((ele) => ele.name),
            name: 'list',
        })
            .then((res) => res.list);
        const listId = lists.find((ele) => ele.name === finishName).id;
        await service.moveCardToFinish(listId, thisWeekList.map((ele) => ele.id));
    }
    if (config.NO_ASK.toLowerCase() === 'false') {
        const ans = await inquirer_1.default
            .prompt({
            message: 'Save the config?',
            type: 'confirm',
            name: 'ans',
        })
            .then((res) => res.ans);
        if (!ans)
            return;
        config.NO_ASK = 'TRUE';
        config.MAIL_SIGNATURE_FILE = path_1.resolve(process.cwd(), config.MAIL_SIGNATURE_FILE);
        fs_1.writeFileSync(path_1.resolve(os_1.homedir(), '.trello-weekly-report'), JSON.stringify(config), {
            encoding: 'utf8',
        });
    }
}
async function MainProcess() {
    let config = (dotenv_1.default.config({ path: arg.file }).parsed ||
        dotenv_1.default.config().parsed);
    if (fs_1.existsSync(path_1.resolve('~', '.trello-weekly-report'))) {
        config = JSON.parse(fs_1.readFileSync(path_1.resolve('~', '.trello-weekly-report'), {
            encoding: 'utf8',
        }));
    }
    const { useConfig } = config
        ? await inquirer_1.default.prompt({
            message: 'Use Config',
            default: true,
            type: 'confirm',
            name: 'useConfig',
        })
        : { useConfig: false };
    if (!config || !useConfig) {
        config = await configure_1.configure();
    }
    if (!validateFile(config)) {
        throw new Error('Config file get error!');
    }
    await doStuff(config);
}
MainProcess();
//# sourceMappingURL=main.js.map