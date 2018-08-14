/* eslint-disable quotes, strict */


//node ./scratch/queries.js

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

// Find/Search for notes using Note.find
// test - clint's solution:

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = 'lady gaga';
//     let filter = {};

//     if (searchTerm) {
//       // or([filter.title = { $regex: searchTerm, $options: 'i' }, filter.content = { $regex: searchTerm, $options: 'i' }])
//       // filter.title = { $regex: searchTerm, $options: 'i' };
//       // filter.content = { $regex: searchTerm, $options: 'i' };
//       const searchArray = [];
//       searchArray.push({'title': {$regex: searchTerm, $options: 'i' }});
//       searchArray.push({ 'title': {$regex: searchTerm, $options: 'i' }});
//       filter = {$or: searchArray};
//     };

//     return Note.find(filter).sort({ updatedAt: 'desc' })

//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });


// Find note by id using Note.findById
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = "000000000000000000000001";
//     return Note.findById(id);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Create a new note using Note.create
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const demoCreate = {
//       title: 'testing create at 2:22pm',
//       content: 'blah blah blah'
//     };
//     return Note.create(demoCreate);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Update a note by id using Note.findByIdAndUpdate
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = "5b732c0bf5e64707d55898dd";
//     const demoUpdate = {
//       title: 'testing update at 2:26pm',
//       content: 'blah blah blah blah blah blah'
//     };
//     return Note.findByIdAndUpdate(id, {$set: demoUpdate}, { new: true});
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Delete a note by id using Note.findByIdAndRemove
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = "5b732c0bf5e64707d55898dd";
//     return Note.findByIdAndRemove(id);
//   })
//   .then(() => {
//     console.log("note deleted");
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });
