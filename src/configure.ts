import { Trello } from './definition'
import inquirer from 'inquirer'
import { sendMail } from './mail'
import { TrelloService } from './trelloService'

export async function configure() {
  const result = await inquirer.prompt<
    Trello.ENV & { hasCC: boolean; hasSignature: boolean }
  >([
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
        return v.hasCC
      },
      message: 'CC to ?(Comma separated list)',
      type: 'input',
      name: 'MAIL_CC',
    },
    { message: 'Mail Subject?', type: 'input', name: 'MAIL_SUBJECT' },
    { message: 'Has signatureFile?', type: 'confirm', name: 'hasSignature' },
    {
      when(v) {
        return v.hasSignature
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
  ])
  // console.log('Do the validation with mail, please wait')
  // await sendMail({
  //   auth: { user: result.MAIL_USER, pass: result.MAIL_PASSWORD },
  //   subject: 'Cli test',
  //   to: result.MAIL_USER,
  //   html: 'This is the test mail',
  // })
  console.log('Do the trello key and token validation, please wait')
  const service = new TrelloService({
    key: result.TRELLO_KEY,
    token: result.TRELLO_TOKEN,
  })
  await service.getPersonalId()

  console.log('Configure complete')
  return result
}
