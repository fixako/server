import * as winston from 'winston';
import { Db, ObjectId } from 'mongodb';
import { Request, Response, Express } from 'express';

import { db } from '../server';


function find(req: Request, res: Response) {
  winston.debug('/find called');
  db.collection(req.body.collection).find(
    req.body.filter,
    req.body.projection ? req.body.projection : {}
  ).toArray().then(result => { res.send(result); });
}

function insert(req: Request, res: Response) {
  winston.debug('/insert called');
  db.collection(req.body.collection).insertOne(
    req.body.doc
  ).then(result => res.send(result));
}

function update(req: Request, res: Response) {
  winston.debug('/update called');
  db.collection(req.body.collection).updateOne(
    req.body.olddoc,
    req.body.newdoc,
  ).then(result => res.send(result));
}

function deleteOne(req: Request, res: Response) {
  winston.debug('/delete called');
  db.collection(req.body.collection).deleteOne(
    req.body.doc
  ).then(result => { res.send(result); });
}

function modify(req: Request, res: Response) {
  const collection = req.body.collection;
  const mods = req.body.modifications;

  console.log(mods);

  mods.inserted.forEach(doc => {
    doc._id = new ObjectId(doc._id);
    db.collection(collection).insertOne(doc).then(response => {
      res.send(response);
    });
  });

  mods.updated.forEach(doc => {
    const id = new ObjectId(doc._id);
    delete doc._id;
    console.log(doc);
    db.collection(collection).update({ _id: id }, { $set: doc }).then(response => {
      res.send(response);
    });
  });

  // mods.forEach(modification => {
  //   switch (modification.action) {
  //     case 'insert':
  //       db.collection(req.body.collection).insertOne(
  //         modification.doc
  //       ).then(result => res.send(result));
  //       break;
  //     case 'update':
  //       modification.doc._id = new ObjectId(modification.doc._id);
  //       db.collection(req.body.collection).replaceOne(
  //         { _id: modification.doc._id }, modification.doc
  //       ).then(result => res.send(result));
  //       break;
  //     case 'delete':
  //       const id = new ObjectId(modification.doc._id);
  //       db.collection(req.body.collection).deleteOne(
  //         { _id: id }
  //       ).then(result => res.send(result));
  //       break;
  //     default:
  //       break;
  //   }
  // });
}

function modifyOrder(modifications: any) {
  modifications.inserted.forEach(doc => {
    doc._id = new ObjectId(doc._id);

  });
}

export { find, insert, update, deleteOne, modify };
