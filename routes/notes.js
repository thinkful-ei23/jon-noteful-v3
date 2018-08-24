'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');


function validateFolderId(userId, folderId) {
  if (!folderId) {
    return Promise.resolve();
  }
  return Folder.findOne({ _id: folderId, userId })
    .then(result => {
      if (!result) {
        return Promise.reject('InvalidFolder');
      }
    });
}

function validateTagIds(userId, tags = []) {
  if (!tags.length) {
    return Promise.resolve();
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        return Promise.reject('InvalidTag');
      }
    });
}


const router = express.Router();

// Protect endpoints using JWT Strategy

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId  } = req.query;

  const userId = req.user.id;

  let filter = {userId};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note
    .find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error ('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note
    .findOne({ _id: id, userId })
    .populate('tags')
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

  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  const newNote = { title, content, folderId, tags, userId };

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    newNote.folderId = folderId;
  } else {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  const inValidTags = tags.map(tag => {
    return mongoose.Types.ObjectId.isValid(tag);
  });

  if (inValidTags.length === tags.length) {
    newNote.tags = tags;
  } else {
    const err = new Error('The `tags.id` is not valid');
    err.status = 400;
    return next(err);
  }

  const valFolderIdProm = validateFolderId(userId, newNote.folderId);
  const valTagIdsProm = validateTagIds(userId, newNote.tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => Note.create(newNote))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const updateNote = { title, content, folderId, tags };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateNote.folderId = folderId;
  }

  // if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
  //   const err = new Error('The `folderId` is not valid');
  //   err.status = 400;
  //   return next(err);
  // }

  // if (tags && !tags.every(tag => mongoose.Types.ObjectId.isValid(tag))) {
  //   const err = new Error('The tag `id` is not valid');
  //   err.status = 400;
  //   return next(err);
  // }
  
  const valFolderIdProm = validateFolderId(userId, folderId);
  const valTagIdsProm = validateTagIds(userId, tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => {
      return Note.findByIdAndUpdate(id, updateNote, { new: true }).populate('tags');
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});


/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({ _id: id, userId })
    .then(result => {
      if (!result) {
        next();
      }
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;