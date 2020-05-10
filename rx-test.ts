import { zip, from, of } from 'rxjs';
import dotenv from 'dotenv';
import { Trello } from './src/definition';
import { homedir } from 'os';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import inquirer from 'inquirer';
import { configure } from './src/configure';
import { subDays, lastDayOfWeek, format } from 'date-fns';
import { TrelloService } from './src/trelloService';

const readConfig = (path?: string) =>
  of(
    dotenv.config(path ? { path } : undefined).parsed as Trello.ENV | undefined
  ).pipe(
    map((res) => {
      if (!res) throw new Error();
      return res;
    }),
    catchError((err) => of(false as false))
  );

const basicConfig = readConfig();
const assign = readConfig(process.argv[2]);
const getHomeConfig: () => Trello.ENV | false = () => {
  const filePath = resolve(homedir(), '.weekly-report');
  if (existsSync(filePath)) {
    return JSON.parse(
      readFileSync(filePath, { encoding: 'utf8' })
    ) as Trello.ENV;
  } else {
    return false;
  }
};

function validateFile(config: Trello.ENV) {
  const empty = Object.entries(config).filter((ele) => ele[1] === '');
  if (empty.length === 0) return true;
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
    );
  return allow;
}

const getConfigure = async (arg: (Trello.ENV | false)[]) => {
  const _config = arg.find((e) => e);
  if (_config && validateFile(_config)) return _config;
  const config = await configure(_config || undefined);
  return config;
};

const lastFriday$ = () => of(new Date()).pipe(
  map((n) => subDays(n, 7)),
  map((n) => lastDayOfWeek(n, { weekStartsOn: 6 })),
  map((n) => format(n, 'MMdd'))
);

const mailSubject$ = (str: string) =>
  zip(lastFriday$(), of(str)).pipe(
    mergeMap(([date, subject]) => of(`[${date}]${subject || 'hello world'}`))
  );
const createService = (auth: { key: string; token: string }) =>
  new TrelloService(auth);

type IPassingArg = Trello.ENV & {
  service: TrelloService;
  boardId: string[];
  thisWeekListId: string[];
  nextWeekListId: string[];
  userId: string;
  thisWeekList: string[];
  nextWeekList: string[];
};

const basicConfigure$ = () => zip(basicConfig, assign, of(getHomeConfig())).pipe(
  mergeMap(getConfigure),
  mergeMap((config) => {
    return mailSubject$((config as Trello.ENV).MAIL_SUBJECT).pipe(
      map((mailSubject) => ({
        ...(config as Trello.ENV),
        MAIL_SUBJECT: mailSubject,
      })),
      mergeMap(async (config) => {
        const service = createService({
          key: config.TRELLO_KEY,
          token: config.TRELLO_TOKEN,
        });
        return of({ ...config, service });
      })
    );
  })
);
