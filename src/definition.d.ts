export namespace Trello {
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
