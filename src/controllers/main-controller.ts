import * as winston from 'winston';
import { Db, ObjectId } from 'mongodb';
import { Request, Response, Express } from 'express';
import { concat, keys, cloneDeep } from 'lodash';
import { db } from '../server';


function find(req: Request, res: Response) {
  winston.debug('/find called');

  switch (req.body.collection) {
    case 'supplies':
      db.collection(req.body.collection).find(
        req.body.filter,
        req.body.projection ? req.body.projection : {}
      ).sort({ name: 1 }).toArray().then(result => {
        res.send(result);
      });
      return;
    case 'products':
      db.collection(req.body.collection).find(
        req.body.filter,
        req.body.projection ? req.body.projection : {}
      ).sort({ name: 1 }).toArray().then(result => {
        res.send(result);
      });
      return;
    case 'supplyOrders':
      db.collection(req.body.collection).find(
        req.body.filter,
        req.body.projection ? req.body.projection : {}
      ).sort({ arrivalDate: -1 }).toArray().then(result => {
        res.send(result);
      });
      return;
    case 'productOrders':
      db.collection(req.body.collection).find(
        req.body.filter,
        req.body.projection ? req.body.projection : {}
      ).sort({ deadline: -1 }).toArray().then(result => {
        res.send(result);
      });
      return;
    case 'machines':
      db.collection(req.body.collection).find(
        req.body.filter,
        req.body.projection ? req.body.projection : {}
      ).sort({ name: 1 }).toArray().then(result => {
        res.send(result);
      });
      return;
    default:
      break;
  }

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
  const necessary = await db.collection('productOrders').aggregate([
    { $unwind: '$products' }, { $lookup: { from: 'products', localField: 'products.name', foreignField: 'name', as: 'necessary' } },
    { $unwind: '$necessary' }, { $unwind: '$necessary.necessary' },
    { $project: { name: 1, total: { $multiply: ['$products.qty', '$necessary.necessary.qty'] }, supply: '$necessary.necessary.name' } },
    { $group: { _id: { name: '$name', supply: '$supply' }, total: { $sum: '$total' } } },
    { $group: { _id: '$_id.name', supplies: { $push: { name: '$_id.supply', qty: '$total' } } } },
    { $project: { ordername: '$_id', required: '$supplies' } }]).toArray();

  const inventory = await db.collection('supplies').find().toArray();

  necessary.forEach(element => {
    element.required.forEach(elem => {
      inventory.forEach(el => {
        if (elem.name === el.name) {
          elem.qty = el.qty - elem.qty;
          return;
        }
      });
    });
  });

  res.send(necessary);
}


async function getNecessaryAsCSV(req: Request, res: Response) {
  const necessary = (await db.collection('productOrders').aggregate([
    { $unwind: '$products' }, { $lookup: { from: 'products', localField: 'products.name', foreignField: 'name', as: 'necessary' } },
    { $unwind: '$necessary' }, { $unwind: '$necessary.necessary' },
    { $project: { name: 1, total: { $multiply: ['$products.qty', '$necessary.necessary.qty'] }, supply: '$necessary.necessary.name' } },
    { $group: { _id: { name: '$name', supply: '$supply' }, total: { $sum: '$total' } } },
    { $group: { _id: '$_id.name', supplies: { $push: { name: '$_id.supply', qty: '$total' } } } },
    { $project: { ordername: '$_id', required: '$supplies' } },
    { $match: { ordername: req.body.selectedProductOrder } }
  ]).toArray())[0];

  const inventory = await db.collection('supplies').find().toArray();

  console.log(necessary);

  necessary.required.forEach(elem => {
    inventory.forEach(el => {
      if (elem.name === el.name) {
        elem.qty = el.qty - elem.qty;
        return;
      }
    });
  });

  let necessaryAsCSV = 'Supply Name, Amount available \n';

  if (necessary) {
    necessary.required.forEach(element => {
      necessaryAsCSV += element.name + ', ' + element.qty + '\n';
    });
  }

  console.log(necessaryAsCSV);

  res.send(necessaryAsCSV);
}

async function getMachineNecessary(req: Request, res: Response) {
  const machineNecessary = await db.collection('productOrders').aggregate([
    { $unwind: '$products' }, { $lookup: { from: 'products', localField: 'products.name', foreignField: 'name', as: 'necessary' } },
    { $unwind: '$necessary' }, { $unwind: '$necessary.phases' },
    { $project: { name: 1, total: { $multiply: ['$products.qty', '$necessary.phases.time'] }, machine: '$necessary.phases.machineName' } },
    { $group: { _id: { name: '$name', machine: '$machine' }, total: { $sum: '$total' } } },
    { $group: { _id: '$_id.name', machines: { $push: { name: '$_id.machine', qty: { $divide: ['$total', 3600] } } } } },
    { $project: { ordername: '$_id', required: '$machines' } }]).toArray();

  machineNecessary.forEach(element => {
    element.required.forEach(elem => {
      elem.qty = elem.qty.toFixed(4);
    });
  });

  res.send(machineNecessary);
}

async function getPrice(req: Request, res: Response) {
  const supplyPrice = await db.collection('productOrders').aggregate([
    { $unwind: '$products' },
    { $lookup: { from: 'products', localField: 'products.name', foreignField: 'name', as: 'necessary' } },
    { $unwind: '$necessary' }, { $unwind: '$necessary.necessary' },
    { $lookup: { from: 'supplies', localField: 'necessary.necessary.name', foreignField: 'name', as: 'supply' } },
    { $unwind: '$supply' },
    { $project: { name: 1, supplyPrice: { $multiply: ['$products.qty', '$necessary.necessary.qty', '$supply.price'] } } },
    { $group: { _id: { name: '$name' }, supplyPrice: { $sum: '$supplyPrice' } } },
    { $project: { _id: 0, ordername: '$_id.name', supplyPrice: 1 } }]).toArray();

  const machinePrice = await db.collection('productOrders').aggregate([
    { $unwind: '$products' },
    { $lookup: { from: 'products', localField: 'products.name', foreignField: 'name', as: 'necessary' } },
    { $unwind: '$necessary' }, { $unwind: '$necessary.phases' },
    { $lookup: { from: 'machines', localField: 'necessary.phases.machineName', foreignField: 'name', as: 'machines' } },
    { $unwind: '$machines' },
    { $project: { name: 1, machines: 1, machinePrice: { $multiply: ['$products.qty', '$necessary.phases.time'] } } },
    { $group: { _id: { name: '$name' }, machinePrice: { $sum: { $multiply: ['$machines.price', { $divide: ['$machinePrice', 3600] }] } } } },
    { $project: { _id: 0, ordername: '$_id.name', machinePrice: 1 } }
  ]).toArray();


  supplyPrice.forEach(element => {
    machinePrice.forEach(elem => {
      if (element.ordername === elem.ordername) {
        element.machinePrice = elem.machinePrice;
        element.total = elem.machinePrice + element.supplyPrice;
        return;
      }
    });
  });

  res.send(supplyPrice);
}

export { find, insert, update, deleteOne, modify, getNecessary, getNecessaryAsCSV, getMachineNecessary, getPrice };
