import * as winston from 'winston';
import { Db, ObjectId } from 'mongodb';
import { Request, Response, Express } from 'express';
import { concat, keys, cloneDeep } from 'lodash';
import { db } from '../server';


function find(req: Request, res: Response) {
  winston.debug('/find called');

  db.collection(req.body.collection).find(
    req.body.filter,
    req.body.projection ? req.body.projection : {}
  ).toArray().then(result => {
    res.send(result);
  });
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

async function modify(req: Request, res: Response) {
  const collection = req.body.collection;
  const mods = req.body.modifications;

  if (collection === 'supplies') {
    // await preSupplyModifications(mods);
  }

  mods.inserted.forEach(doc => {
    doc._id = new ObjectId(doc._id);
    db.collection(collection).insertOne(doc).then(response => {
      res.send(response);
    });
  });

  mods.updated.forEach(doc => {
    const id = new ObjectId(doc._id);
    delete doc._id;
    db.collection(collection).update({ _id: id }, { $set: doc }).then(response => {
      res.send(response);
    });
  });

  mods.deleted.forEach(doc => {
    const id = new ObjectId(doc._id);
    db.collection(collection).deleteOne({ _id: id }).then(response => {
      res.send(response);
    });
  });

}

async function preSupplyModifications(modifications: any) {
  modifications.updated.forEach(async doc => {
    const before = await db.collection('supplies').findOne({ _id: new ObjectId(doc._id) });
    const filter: any = { arrayFilters: [{ 'qty.qty': { $lt: 22 } }] };

    const orders = await db.collection('orders').find().toArray();

    orders.forEach(order => {
      order.supplies.forEach(supply => {
        if (supply.name === before.name) {
          supply.name = doc.name;
        }
        db.collection('orders').update(
          { _id: order._id },
          { $set: { 'supply.name': doc.name } }
        );
      });

    });
  });

  modifications.deleted.forEach(async doc => {
    db.collection('orders').update(
      {},
      { $pull: { supplies: { name: doc.name } } },
      { multi: true }
    );
  });
  return;
}

async function getNecessary(req: Request, res: Response) {
  // const necessary = await db.collection('productOrders').aggregate([
  //   { $unwind: '$products' },
  //   {
  //     $lookup:
  //       { from: 'products', localField: 'products.product', foreignField: 'name', as: 'req' }
  //   },
  //   { $unwind: '$req' }, { $unwind: '$req.requirements' },
  //   { $group: { _id: { name: '$name', supply: '$req.requirements.supply' }, total: { $sum: '$req.requirements.qty' } } },
  //   { $group: { _id: '$_id.name', supplies: { $push: { name: '$_id.supply', qty: '$total' } } } },
  //   { $project: { ordername: '$_id', required: '$supplies' } },
  // ]).toArray();

  const necessary = await db.collection('productOrders').aggregate([
    { $unwind: '$products' }, { $lookup:  { from: 'products', localField: 'products.product', foreignField: 'name', as: 'req' }  }, 
    { $unwind: '$req' }, { $unwind: '$req.requirements' },
    { $project: { name: 1, total: { $multiply: [ '$products.qty', '$req.requirements.qty' ]  }, supply: '$req.requirements.supply' } }, 
    { $group: { _id: { name: '$name', supply: '$supply' }, total: { $sum: '$total' }}},
    { $group: { _id: '$_id.name', supplies: { $push: { name: '$_id.supply', qty: '$total' } } } },
    { $project: { ordername: '$_id', required: '$supplies' } } ]).toArray();
  // const inventory = await db.collection('supplies').find().toArray();
  console.log(necessary);
  res.send(necessary);
}

export { find, insert, update, deleteOne, modify, getNecessary };
