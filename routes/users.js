'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const User = require('../models/user');

// POST/CREATE User
router.post('/', (req, res, next) => {

  let { username, password, fullname } = req.body;

  return User
    .find( { username } )
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(digest => {
      return User
        .create({
          username,
          password: digest,
          fullname
        });
    })
    .then(result => {
      return res
        .status(201)
        .location(`/api/users/${result.id}`)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) { // duplicate key error 
        err = new Error('Username already exists');
        err.status = 400;
      }
      next(err);
    });

});

module.exports = router;