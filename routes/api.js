
'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').find().toArray((err, docs) => {
          docs = docs.map(item => 
            ({title: item.title,
              _id: item._id,
              commentcount: item.comments.length})
          )
          res.json(docs)
          db.close()
        })
      });
      
    })
    
    .post(function (req, res){
      var title = req.body.title;
      if (title === '') return res.type('text').send('missing title');
      let book = {title: title, comments: []}
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').insertOne(book, (err, docs) => {
          res.json(docs.ops[0])
          db.close()
        })
      });
      
    })
    
    .delete(function(req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').remove({}, (err, docs) => {
          if (err) throw err;
          console.log(docs.result.ok)
          if (docs.result.ok == 1) res.json('complete delete successful')
          db.close()
        })
      });
      
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      
      try {
        ObjectId(bookid)
      } catch(err) {
        return res.type('text').send('no book exists');
      }
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').findOne({_id: ObjectId(bookid)}, (err, docs) => {
          if (err) throw err;
          docs !== null ? res.json(docs) : res.type('text').send('no book exists')
          db.close()
        })
      });
  
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
    
      try {
        ObjectId(bookid)
      } catch(err) {
        return res.json('no book exists');
      }
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').findOneAndUpdate({_id: ObjectId(bookid)}, {$push: {comments: comment}}, {returnOriginal: false}, (err, docs) => {
          if (err) throw err;
          docs.lastErrorObject.updatedExisting === true ? res.json(docs.value) : res.type('text').send('no book exists')
          db.close()
        })
      });
    
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
    
      try {
        ObjectId(bookid)
      } catch(err) {
        return res.json('invalid id');
      }
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').remove({_id: ObjectId(bookid)}, (err, docs) => {
          if (err) throw err;
          if (docs.result.ok) res.json('delete successful')
          db.close()
        })
      });
    
    });
  
};
