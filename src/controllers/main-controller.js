"use strict";
exports.__esModule = true;
var winston = require("winston");
var mongodb_1 = require("mongodb");
var server_1 = require("../server");
function find(req, res) {
    winston.debug('/find called');
    server_1.db.collection(req.body.collection).find(req.body.filter, req.body.projection ? req.body.projection : {}).toArray().then(function (result) { res.send(result); });
}
exports.find = find;
function insert(req, res) {
    winston.debug('/insert called');
    server_1.db.collection(req.body.collection).insertOne(req.body.doc).then(function (result) { return res.send(result); });
}
exports.insert = insert;
function update(req, res) {
    winston.debug('/update called');
    server_1.db.collection(req.body.collection).updateOne(req.body.olddoc, req.body.newdoc).then(function (result) { return res.send(result); });
}
exports.update = update;
function deleteOne(req, res) {
    winston.debug('/delete called');
    server_1.db.collection(req.body.collection).deleteOne(req.body.doc).then(function (result) { res.send(result); });
}
exports.deleteOne = deleteOne;
function modify(req, res) {
    var collection = req.body.collection;
    var mods = req.body.modifications;
    console.log(mods);
    mods.inserted.forEach(function (doc) {
        doc._id = new mongodb_1.ObjectId(doc._id);
        server_1.db.collection(collection).insertOne(doc).then(function (response) {
            res.send(response);
        });
    });
    mods.updated.forEach(function (doc) {
        var id = new mongodb_1.ObjectId(doc._id);
        delete doc._id;
        console.log(doc);
        server_1.db.collection(collection).update({ _id: id }, { $set: doc }).then(function (response) {
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
exports.modify = modify;
function modifyOrder(modifications) {
    modifications.inserted.forEach(function (doc) {
        doc._id = new mongodb_1.ObjectId(doc._id);
    });
}
