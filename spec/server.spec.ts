import * as request from 'request';
import { RequestResponse } from 'request';
import * as rp from 'request-promise';
import * as winston from 'winston';

import { Response } from 'express';

import { start, stop, db } from '../src/server';
import { ObjectID, ObjectId } from 'mongodb';

const baseUrl = 'http://localhost:3000/';
const logLevel = process.env.LOG_LEVEL;

winston.configure({
    level: logLevel ? logLevel : 'warn',
    transports: [
        new (winston.transports.Console)({
            prettyPrint: true
        }),
    ]
});

function find(collection: string, filter: object, projection?: any): Promise<any> {
    const data = {
        collection: collection,
        filter: filter,
        projection: projection ? projection : {}
    };

    const header = {
        url: baseUrl + 'find',
        method: 'POST',
        json: data
    };

    return new Promise((resolve, reject) => {
        request(header, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject(err);
            }
            resolve(body);
        });
    });
}

function insert(collection: string, doc: object): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = {
            collection: collection,
            doc: doc
        };
        const header = {
            url: baseUrl + 'insert',
            method: 'PUT',
            json: data
        };

        request(header, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject(err);
            }
            resolve(body);
        });
    });
}

function deleteOne(collection: string, doc: object): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = {
            collection: collection,
            doc: doc
        };

        const header = {
            url: baseUrl + 'delete',
            method: 'DELETE',
            json: data
        };

        request(header, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject(err);
            }
            resolve(body);
        });
    });
}

function update(collection: string, olddoc: object, newdoc: object): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = {
            collection: collection,
            olddoc: olddoc,
            newdoc: newdoc
        };

        const header = {
            url: baseUrl + 'update',
            method: 'POST',
            json: data
        };

        request(header, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject(err);
            }
            resolve(body);
        });
    });
}

xdescribe('jasmine describe', () => {
    it('jasmine it', () => {
        console.log('jasmine it');
    });
});


describe('server test', () => {
    beforeAll(done => {
        winston.debug('starting server');
        start().then(res => done());
    });

    afterAll(function () {
        winston.debug('closing server');
        stop();
    });

    it('insert', async done => {
        try {
            await insert('supplies', { name: 'iron', qty: 2 });
            done();
        } catch {
            done.fail();
        }
    });

    fit('update', async done => {
        try {
            console.log(new Date());
            const res = await update('supplies', { name: 'iron' }, { $set: { date: new Date('2017-10') } });
            winston.debug(res);
            done();
            return;
        } catch {
            done.fail();
        }
    });

    it('delete', async done => {
        try {
            const docs = await find('supplies', { name: 'iron' });

            if (docs.length == 0) {
                done();
                return;
            }

            const doc = docs[0];
            const res = await deleteOne('supplies', { name: doc.name });

            done();
        } catch {
            done.fail();
        }
    });

    it('find', async done => {
        try {
            winston.debug('find it');
            const docs = await find('supplies', {}, { _id: 0, date: 1 });
            winston.verbose('docs = ', docs);
            done();
        } catch {
            done.fail();
        }
    });

    fit('find by objectid', async done => {
        try {
            winston.debug('find by objectid');
            const docs = await find('supplies', { date: new Date('2017-10') }, {});
            winston.debug(docs);
            done();
        } catch {
            done.fail();
        }
    });

});