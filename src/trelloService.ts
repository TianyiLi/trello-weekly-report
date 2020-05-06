import axios from 'axios'
import { stringify } from 'query-string'
const baseURL = 'https://api.trello.com'
const req = axios.create({
  baseURL: baseURL,
})
export class TrelloService {
  private _auth: { key: string; token: string }
  constructor(auth: { key: string; token: string }) {
    this._auth = auth
  }
  async getPersonalId() {
    try {
      const res = await req.get<{
        id: string
      }>(
        `/1/members/me/?${stringify({
          ...this._auth,
          fields: 'id',
        })}`
      )
      return res.data
    } catch (err) {
      return console.error(err), { id: '-1' }
    }
  }

  async getBoards() {
    const res = await req.get<
      {
        id: string
        name: string
      }[]
    >(`/1/members/me/boards?${stringify({ ...this._auth, fields: 'name' })}`)
    return res.data
  }

  async getListInBoard(board: { id: string; name: string }) {
    const res = await req.get(
      `/1/boards/${board.id}/lists?${stringify({
        ...this._auth,
        fields: 'name',
      })}`
    )
    return res.data as {
      name: string
      id: string
    }[]
  }

  async getList(id: string) {
    const res = await req.get<
      {
        id: string
        name: string
        idMembers: string[]
      }[]
    >(
      `/1/lists/${id}/cards?${stringify({
        ...this._auth,
        fields: 'name,idMembers',
      })}`
    )
    return res.data
  }
}
