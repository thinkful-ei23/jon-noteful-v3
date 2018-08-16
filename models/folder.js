'use strict';
// from ./models/note.js

// const mongoose = require('mongoose');

// const noteSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   content: String
// });

// // Add 'createdAt' and 'updatedAt' fields
// noteSchema.set('timestamps', true);


// noteSchema.set('toObject', {
//   virtuals: true, // include built-in virtual `id`
//   versionKey: false, // remove `__v` version key
//   transform: (doc, ret) => {
//     delete ret._id; //delete `_id`
//   }
// });

// module.exports = mongoose.model('Note', noteSchema);

// https://courses.thinkful.com/dev-301v1/assignment/2.7.4

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

folderSchema.set('timestamps', true);

folderSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Folder', folderSchema);