"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const query_string_1 = require("query-string");
const baseURL = 'https://api.trello.com';
const req = axios_1.default.create({
    baseURL: baseURL,
});
class TrelloService {
    constructor(auth) {
        this._auth = auth;
    }
    async getPersonalId() {
        try {
            const res = await req.get(`/1/members/me/?${query_string_1.stringify(Object.assign(Object.assign({}, this._auth), { fields: 'id' }))}`);
            return res.data;
        }
        catch (err) {
            return console.error(err), { id: '-1' };
        }
    }
    async getBoards() {
        const res = await req.get(`/1/members/me/boards?${query_string_1.stringify(Object.assign(Object.assign({}, this._auth), { fields: 'name' }))}`);
        return res.data;
    }
    async getListInBoard(board) {
        const res = await req.get(`/1/boards/${board.id}/lists?${query_string_1.stringify(Object.assign(Object.assign({}, this._auth), { fields: 'name' }))}`);
        return res.data;
    }
    async getList(id) {
        const res = await req.get(`/1/lists/${id}/cards?${query_string_1.stringify(Object.assign(Object.assign({}, this._auth), { fields: 'name,idMembers' }))}`);
        return res.data;
    }
}
exports.TrelloService = TrelloService;
//# sourceMappingURL=trelloService.js.map