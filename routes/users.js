'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const User = require('../models/user');

// POST/CREATE User
router.post('/', (req, res, next) => {

  // validation - The username and password fields are required
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body)); 

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next(err);
  } 

  // Validation - The fields are type string
  const stringFields = ['username', 'password', 'fullname'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  // Validation - The username and password should not have leading or trailing whitespace. And the endpoint should not automatically trim the values
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  // Validation - The username is a minimum of 1 character
  // Validation - The password is a minimum of 8 and max of 72 characters
  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  // Check for existing user then hashPassword then post
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