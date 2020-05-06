import inquirer from 'inquirer'
import minimist from 'minimist'
import dotenv from 'dotenv'
import axios from 'axios'
import { stringify } from 'query-string'
import didyoumean from 'didyoumean'
import { list2HTML, sendMail } from './mail'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { format } from 'date-fns'
import table from 'cli-table2'
import { homedir } from 'os'

const arg = minimist(process.argv.slice(2))
const baseURL = 'https://api.trello.com'
const req = axios.create({
  baseURL: baseURL,
})

namespace Trello {
  export interface ENV {
    MAIL_USER: string
    MAIL_PASSWORD: string
    MAIL_CC: string
    MAIL_TO: string
    MAIL_SUBJECT: string
    MAIL_SIGNATURE_FILE: string

    TRELLO_KEY: string
    TRELLO_TOKEN: string

    TARGET_BOARD_NAME: string
    NEXT_WEEK_LIST_NAME: string
    THIS_WEEK_LIST_NAME: string

    NO_ASK: string
  }
}

function validateFile(config: Trello.ENV) {
  const empty = Object.entries(config).filter((ele) => ele[1] === '')
  if (empty.length === 0) return true
  console.log(empty)
  const allow = empty
    .map((ele) => ele[0])
    .every((ele) =>
      [
        'TARGET_BOARD_NAME',
        'TARGET_FROM_LIST_NAME',
        'TARGET_TO_LIST_NAME',
        'MAIL_CC',
        'MAIL_SIGNATURE_FILE',
      ].includes(ele)
    )
  return allow
}

async function doStuff(config: Trello.ENV, useConfig = false) {
  const auth = { key: config.TRELLO_KEY, token: config.TRELLO_TOKEN }

  const { id: personId } = await req
    .get<{ id: string }>(
      `/1/members/me/?${stringify({
        ...auth,
        fields: 'id',
      })}`
    )
    .then(
      (res) => res.data,
      (err) => (console.error(err), { id: '-1' })
    )
  if (personId === '-1') process.exit(1)
  const boards = await req
    .get<{ id: string; name: string }[]>(
      `/1/members/me/boards?${stringify({ ...auth, fields: 'name' })}`
    )
    .then((res) => res.data)
  if (config.TARGET_BOARD_NAME === '') {
    config.TARGET_BOARD_NAME = (
      await inquirer.prompt<{ name: string }>({
        message: 'Which board do you want to?',
        default: boards[0].name,
        type: 'list',
        name: 'name',
        choices: boards.map((ele) => ele.name),
      })
    ).name
  }
  const board = boards.find((ele) => ele.name === config.TARGET_BOARD_NAME)
  if (!board)
    throw new Error(`cannot find ${config.TARGET_BOARD_NAME} in the list`)
  const list = await req
    .get(
      `/1/boards/${board.id}/lists?${stringify({ ...auth, fields: 'name' })}`
    )
    .then((res) => res.data as { name: string; id: string }[])

  // This week
  if (!config.THIS_WEEK_LIST_NAME) {
    const thisWeek = (
      await inquirer.prompt<{ thisWeek: string }>({
        message: 'Which list you want to set to this week?',
        default: list[0].name,
        type: 'list',
        name: 'thisWeek',
        choices: list.map((ele) => ele.name),
      })
    ).thisWeek
    config.THIS_WEEK_LIST_NAME = thisWeek
  } else {
    let thisWeek = list.find((ele) => ele.name === config.THIS_WEEK_LIST_NAME)
      ?.name
    if (thisWeek) {
      config.THIS_WEEK_LIST_NAME = thisWeek
    } else {
      const mean = didyoumean(config.THIS_WEEK_LIST_NAME, list as any, 'id')
      if (!mean)
        throw new Error(
          `Cannot find any name like ${config.THIS_WEEK_LIST_NAME}!`
        )
      const nameIsCorrect = await inquirer
        .prompt<{ nameIsTrue: boolean }>({
          message: `Cannot find ${config.THIS_WEEK_LIST_NAME} did you mean ${mean}?`,
          type: 'confirm',
          default: true,
          name: 'nameIsTrue',
        })
        .then((res) => res.nameIsTrue)
      if (!nameIsCorrect) {
        throw new Error(
          `Cannot find the list name called ${config.THIS_WEEK_LIST_NAME}`
        )
      }
      config.THIS_WEEK_LIST_NAME = mean as string
    }
  }

  // Next Week

  if (!config.NEXT_WEEK_LIST_NAME) {
    const nextWeek = (
      await inquirer.prompt<{ nextWeek: string }>({
        message: 'Which list you want to set to this week?',
        default: list[0].name,
        type: 'list',
        name: 'nextWeek',
        choices: list.map((ele) => ele.name),
      })
    ).nextWeek
    config.NEXT_WEEK_LIST_NAME = nextWeek
  } else {
    let nextWeek = list.find((ele) => ele.name === config.NEXT_WEEK_LIST_NAME)
      ?.name
    if (nextWeek) {
      config.NEXT_WEEK_LIST_NAME = nextWeek
    } else {
      const mean = didyoumean(config.NEXT_WEEK_LIST_NAME, list as any, 'id')
      if (!mean)
        throw new Error(
          `Cannot find any name like ${config.NEXT_WEEK_LIST_NAME}!`
        )
      const nameIsCorrect = await inquirer
        .prompt<{ nameIsTrue: boolean }>({
          message: `Cannot find ${config.NEXT_WEEK_LIST_NAME} to did you mean ${mean}?`,
          type: 'confirm',
          default: true,
          name: 'nameIsTrue',
        })
        .then((res) => res.nameIsTrue)
      if (!nameIsCorrect) {
        throw new Error(
          `Cannot find the list name called ${config.NEXT_WEEK_LIST_NAME}`
        )
      }
      config.NEXT_WEEK_LIST_NAME = mean as string
    }
  }

  // assemble
  const thisWeekId = list.find(
    (ele) => ele.name === config.THIS_WEEK_LIST_NAME
  )!.id
  const nextWeekId = list.find(
    (ele) => ele.name === config.NEXT_WEEK_LIST_NAME
  )!.id
  const thisWeekList = await req
    .get<{ id: string; name: string; idMembers: string[] }[]>(
      `/1/lists/${thisWeekId}/cards?${stringify({
        ...auth,
        fields: 'name,idMembers',
      })}`
    )
    .then((res) => res.data)
    .then((data) => data.filter((ele) => ele.idMembers.includes(personId)))
  const nextWeekList = await req
    .get<{ id: string; name: string; idMembers: string[] }[]>(
      `/1/list/${nextWeekId}/cards?${stringify({
        ...auth,
        fields: 'name,idMembers',
      })}`
    )
    .then((res) => res.data)
    .then((data) => data.filter((ele) => ele.idMembers.includes(personId)))
  const mailContent = list2HTML({
    ['Next Week']: nextWeekList.map((ele) => ele.name),
    ['This Week']: thisWeekList.map((ele) => ele.name),
  })
  console.log(`Prepare the email content...`)

  const cliTable = new table({
    head: [
      `This week: ${config.THIS_WEEK_LIST_NAME}`,
      `Next Week ${config.NEXT_WEEK_LIST_NAME}`,
    ],
  })

  Array.from(
    { length: Math.max(thisWeekList.length, nextWeekList.length) },
    (_, i) =>
      cliTable.push([
        thisWeekList[i]?.name || '',
        nextWeekList[i]?.name || '',
      ] as any)
  )

  console.log(cliTable.toString())

  const confirm = await inquirer
    .prompt<{ confirm: boolean }>({
      message: 'Confirm to send?',
      type: 'confirm',
      name: 'confirm',
      default: true,
    })
    .then((res) => res.confirm)
  if (!confirm) process.exit(0)
  const signatureFile = existsSync(config.MAIL_SIGNATURE_FILE)
    ? readFileSync(config.MAIL_SIGNATURE_FILE, { encoding: 'utf8' })
    : ''
  await sendMail({
    auth: { user: config.MAIL_USER, pass: config.MAIL_PASSWORD },
    cc: config.MAIL_CC,
    html: `${mailContent}<br />${signatureFile}`,
    subject: `[${format(new Date(), 'MMdd')}]${config.MAIL_SUBJECT}`,
    to: config.MAIL_TO,
  }).catch(console.error)

  console.log('Success!')
  console.log(config)
  if (config.NO_ASK.toLowerCase() === 'false') {
    const ans = await inquirer
      .prompt({
        message: 'Save the config?',
        type: 'confirm',
        name: 'ans',
      })
      .then((res) => res.ans)
    if (!ans) return
    config.NO_ASK = 'TRUE'
    config.MAIL_SIGNATURE_FILE = resolve(
      process.cwd(),
      config.MAIL_SIGNATURE_FILE
    )
    writeFileSync(
      resolve(homedir(), '.trello-weekly-report'),
      JSON.stringify(config),
      {
        encoding: 'utf8',
      }
    )
  }
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

let config = (dotenv.config({ path: arg.file }).parsed ||
  dotenv.config().parsed) as Trello.ENV | undefined
if (existsSync(resolve('~', '.trello-weekly-report'))) {
  config = JSON.parse(
    readFileSync(resolve('~', '.trello-weekly-report'), {
      encoding: 'utf8',
    })
  ) as Trello.ENV
}
if (!config) {
  throw new Error('Config file does not exist')
}
if (!validateFile(config)) {
  throw new Error('Config file get error!')
}
MainProcess(config)
