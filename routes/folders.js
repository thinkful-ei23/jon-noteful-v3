'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();
const Folder = require('../models/folder');
const Note = require('../models/note');

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// GET all /folders 
// Sort by name
router.get('/', (req, res, next) => {
  // console.log('Get All Notes');
  // const { searchTerm } = req.query;
  // let filter = {};

  // if(searchTerm) {
  //   filter = {name: {$regex: searchTerm, $options: 'i'}};
  // }

  Folder
    .find()
    .sort('name')
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});


// GET /folders by id
// Validate the id is a Mongo ObjectId
// return a 200 response or 404 Not found
router.get('/:id', (req, res, next) => {

  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('The `id` is not valid');
    err.status = 404;
    return next(err);
  }

  Folder
    .findById(id)
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


// POST /folders to create a new folder
// Validate the incoming body has a name field
// Respond with a 201 status and location header
// Catch duplicate key error code 11000 and respond with a helpful error message(see below for sample code)
router.post('/', (req, res, next) => {
  const { name } = req.body;

  const newItem = { name };

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder
    .create(newItem)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

// PUT / folders by id to update a folder name
// Validate the incoming body has a name field
// Validate the id is a Mongo ObjectId
// Catch duplicate key error code 11000 and respond with a helpful error message
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateObj = { name };

  Folder
    .findByIdAndUpdate(id, { $set: updateObj }, { new: true })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

// DELETE / folders by id which deletes the folder AND the related notes
// Respond with a 204 status
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  Folder
    .findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;