import { Trello } from './definition'
import inquirer from 'inquirer'
import { sendMail } from './mail'
import { TrelloService } from './trelloService'
import { existsSync } from 'fs'

export async function configure(config?: Trello.ENV) {
  let result = await inquirer.prompt<
    Trello.ENV & { hasCC: boolean; hasSignature: boolean }
  >([
    {
      when: () => !config?.MAIL_USER,
      message: 'Your office 365 email account?',
      type: 'input',
      name: 'MAIL_USER',
    },
    {
      message: 'Password',
      type: 'password',
      name: 'MAIL_PASSWORD',
      when: () => !config?.MAIL_PASSWORD,
    },
    {
      message: 'Send to?',
      type: 'input',
      name: 'MAIL_TO',
      when: () => !config?.MAIL_TO,
    },
    {
      message: 'Has CC?',
      type: 'confirm',
      name: 'hasCC',
      when: () => !config?.MAIL_CC,
    },
    {
      when(v) {
        return v.hasCC && !config?.MAIL_CC
      },
      message: 'CC to ?(Comma separated list)',
      type: 'input',
      name: 'MAIL_CC',
    },
    {
      message: 'Mail Subject?',
      type: 'input',
      name: 'MAIL_SUBJECT',
      when: () => !config?.MAIL_SUBJECT,
    },
    {
      message: `Has signatureFile?${config?.MAIL_SIGNATURE_FILE && !existsSync(config.MAIL_SIGNATURE_FILE) ? '(file does not exist)' : ''}`,
      type: 'confirm',
      name: 'hasSignature',
      when: () =>
        !config?.MAIL_SIGNATURE_FILE || !existsSync(config.MAIL_SIGNATURE_FILE),
    },
    {
      when(v) {
        return v.hasSignature && !config?.MAIL_SIGNATURE_FILE
      },
      message: 'Signature file position',
      type: 'input',
      name: 'MAIL_SIGNATURE_FILE',
    },
    {
      when: () => !config?.TRELLO_KEY,
      message: 'Trello key, You can get it from https://trello.com/app-key',
      type: 'input',
      name: 'TRELLO_KEY',
    },
    {
      when: () => !config?.TRELLO_TOKEN,
      message: 'Trello Token, You can get it from https://trello.com/app-key',
      type: 'input',
      name: 'TRELLO_TOKEN',
    },
  ])

  result = {
    ...config,
    ...result,
  }

  console.log('Do the validation with mail, please wait')
  await sendMail({
    auth: { user: result.MAIL_USER, pass: result.MAIL_PASSWORD },
    subject: 'Cli test',
    to: result.MAIL_USER,
    html: 'This is the test mail',
  }).catch((err) => {
    console.error(err)
    throw new Error('Email test got error')
  })
  console.log('Do the trello key and token validation, please wait')
  const service = new TrelloService({
    key: result.TRELLO_KEY,
    token: result.TRELLO_TOKEN,
  })
  await service.getPersonalId()

  console.log('Configure complete')
  return result
}
