import * as express from 'express';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as winston from 'winston';
import * as cors from 'cors';
import * as passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as LocalStrategy } from 'passport-local';
import { Db, connect } from 'mongodb';

import * as MongoClient from 'mongodb';

import { find, insert, update, deleteOne, modify, getNecessary } from './controllers/main-controller';

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

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
  (username, password, done) => {
    if (username === 'test' && password === 'test') {
      return done(undefined, { username: 'test', password: 'test' });
    } else {
      return done(undefined, false);
    }
  }
));
passport.serializeUser((u, done) => { done(undefined, u); });
passport.deserializeUser((u, done) => { done(undefined, u); });

app.post('/login', passport.authenticate('local'), (req, res) => { res.send(req.isAuthenticated()); });
app.post('/logout', (req, res) => { req.logout(); res.send('logged out'); });

app.post('/find', find);
app.put('/insert', insert);
app.post('/update', update);
app.post('/modify', modify);
app.delete('/delete', deleteOne);
app.post('/getNecessary', getNecessary);

async function start(): Promise<any> {
  db = await MongoClient.connect('mongodb://localhost:27017/test');

  await new Promise((resolve) => {
    setTimeout(() => { winston.silly('timed out'); resolve(); }, 0);
  });

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
