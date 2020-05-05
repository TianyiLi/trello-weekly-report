import inquirer from 'inquirer'
import minimist from 'minimist'
import dotenv from 'dotenv'
import axios from 'axios'
import { stringify } from 'query-string'

const arg = minimist(process.argv.slice(2))
const baseURL = 'https://api.trello.com/'
const req = axios.create({
  baseURL: baseURL,
})

namespace Trello {
  export interface ENV {
    MAIL_USER: string
    MAIL_PASSWORD: string

    TRELLO_KEY: string
    TRLLO_TOKEN: string

    TARGET_BOARD_NAME: string
    TARGET_FROM_CARD_NAME: string
    TARGET_TO_CARD_NAME: string
  }
  const defaultValue = {
    boardName: '',
    listName: ['This Week', 'Next Week'],
  }
}

function validateFile(config: Trello.ENV) {
  const empty = Object.entries(config).filter((ele) => ele[1] === '')
  if (empty.length === 0) return
  const allow = empty
    .map((ele) => ele[0])
    .every((ele) =>
      [
        'TARGET_BOARD_NAME',
        'TARGET_FROM_CARD_NAME',
        'TARGET_TO_CARD_NAME',
      ].includes(ele)
    )
  return allow
}

if (arg.file) {
  const config = dotenv.config({ path: arg.file }).parsed as
    | Trello.ENV
    | undefined

  if (config && validateFile(config)) {
  }
}

async function doStuff(config: Trello.ENV, useConfig = false) {
  const auth = { key: config.TRELLO_KEY, token: config.TRLLO_TOKEN }
  const { id: personId } = await req
    .get<{ id: string }>(
      `/1/members/me/?${stringify({
        key: config.TRELLO_KEY,
        token: config.TRLLO_TOKEN,
        fields: 'id',
      })}`
    )
    .then((res) => res.data)
  const boards = await req
    .get<{ id: string; name: string }[]>(
      `/1/members/me/boards?${stringify({ ...auth, fields: 'name' })}`
    )
    .then((res) => res.data)
  if (config.TARGET_BOARD_NAME === '') {
    config.TARGET_BOARD_NAME = (
      await inquirer.prompt<{ name: string }>({
        message: 'Which board do you want to?',
        default: boards[0],
        type: 'list',
        name: 'name',
      })
    ).name
  }
  const board = boards.find((ele) => ele.name === config.TARGET_BOARD_NAME)
  if (!board)
    throw new Error(`cannot find ${config.TARGET_BOARD_NAME} in the list`)
  const list = await req
    .get(`/1/boards/${board.id}/lists?${stringify({ ...auth, field: 'name' })}`)
    .then((res) => res.data as { name: string; id: string }[])
  
}

async function MainProcess(config?: Trello.ENV) {
  const { useConfig } = config
    ? await inquirer.prompt<{ useConfig: boolean }>({
        message: 'Use Default Config',
        default: true,
        type: 'confirm',
        name: 'useConfig',
      })
    : { useConfig: false }
  if (useConfig && config) {
    await doStuff(config)
  }
}
