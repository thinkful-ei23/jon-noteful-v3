'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  let filter = {};

  if (searchTerm) {
    const searchArray = [];
    searchArray.push({'title': {$regex: searchTerm, $options: 'i' }});
    searchArray.push({ 'title': {$regex: searchTerm, $options: 'i' }});
    filter = {$or: searchArray};
  }

  Note
    .find(filter)
    .sort({ updatedAt: 'desc' })
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  Note
    .findById(req.params.id)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const { title, content } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content
  };

  Note
    .create(newItem)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const noteId = req.params.id;
  const { title, content } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateObj = {
    title: title,
    content: content
  };

  Note
    .findByIdAndUpdate(noteId, { $set: updateObj }, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  Note
    .findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204).end();
    })
    .catch(err => {
      next(err);
    });
  
});

module.exports = router;