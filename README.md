# Weekly report cli

.env config

- MAIL_USER=username
- MAIL_PASSWORD=password
- MAIL_CC=who's you want to send copy mail
- MAIL_TO=who's you want to send email
- MAIL_SUBJECT=mail subject
- MAIL_SIGNATURE_FILE=[optional]the file path for your signature(html file)

***

- TRELLO_KEY=the trello key

You can get the trello key from this url ([https://trello.com/app-key](https://trello.com/app-key)).
- TRELLO_TOKEN=the trello token

You can get the trello token from this url ([https://trello.com/app-key](https://trello.com/app-key)) and click the token by click the hyperlinked "Token" under the API key.
***

- TARGET_BOARD_NAME=the trello board to get the list
- NEXT_WEEK_LIST_NAME=the trello list which in target board you want to use for next week list
- THIS_WEEK_LIST_NAME=same as NEXT_WEEK_LIST_NAME

### How to use

```bash
git clone https://github.com/TianyiLi/trello-weekly-report
npm install # or yarn
# setup .env
npm start
```

or

```bash
npm i -g git@github.com:TianyiLi/trello-weekly-report.git

weekly-cli --file <path-to-.env>
```