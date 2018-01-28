import * as express from 'express';
import * as session from 'express-session';
const RedisStore = require('connect-redis')(session);
const MongoStore = require('connect-mongo')(session);
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as winston from 'winston';
import * as cors from 'cors';
import * as passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as LocalStrategy } from 'passport-local';
import { Db, connect } from 'mongodb';

import * as MongoClient from 'mongodb';

import { find, insert, update, deleteOne, modify, getNecessary, getNecessaryAsCSV, getMachineNecessary, getPrice } from './controllers/main-controller';

const app: express.Express = express();
let db: Db;
let server;

const logLevel = 'debug';
winston.configure({
  level: logLevel ? logLevel : 'warn',
  transports: [
    new (winston.transports.Console)({
      prettyPrint: true
    }),
  ]
});

app.use(cors({origin: [
  'http://localhost:4200'
], credentials: true}));
app.use(bodyParser.json());
app.set('trust proxy', 1);

app.use(session({
  store: new MongoStore({ url: 'mongodb://localhost:27017/test' }),
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.post('/login', (req, res) => {
  if (req.body.username === 'test' && req.body.password === 'test') {
    req.session.username = 'test';
    res.send(true);
  } else {
    res.send(false);
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(function (err) {
    res.send('logged out successfully');
  });
});

app.all('*', function (req, res, next) {
  winston.debug('should not be undefined ' + req.session.username);
  if (req.session.username !== undefined) {
    next();
  } else {
    res.send([]);
  }
});

app.post('/find', find);
app.put('/insert', insert);
app.post('/update', update);
app.post('/modify', modify);
app.delete('/delete', deleteOne);
app.post('/getNecessary', getNecessary);
app.post('/getNecessaryAsCSV', getNecessaryAsCSV);
app.post('/getMachineNecessary', getMachineNecessary);
app.post('/getPrice', getPrice);

async function start(): Promise<any> {
  const client = await MongoClient.connect('mongodb://localhost:27017/');
  db = client.db('test');
  server = app.listen(3000, () => { winston.debug('Server started on port 3000!'); });
}

function stop() {
  winston.debug('server stopped');
  server.close();
  db.close();
}

start().then(() => {
});

export { app, db, start, stop };
