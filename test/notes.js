'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');

const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Notes', function () {
  let token;
  let user; 

  before(function () {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      User.createIndexes(),

      Note.insertMany(seedNotes),

      Folder.insertMany(seedFolders),
      Folder.createIndexes(),

      Tag.insertMany(seedTags),
      Tag.createIndexes()
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {
    it('should return the correct number of Notes', function () {
      const dbPromise = Note.find({ userId: user.id });
      const apiPromise = chai.request(app).get('/api/notes').set('Authorization', `Bearer ${token}`);
      
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    // it('should return the default array of notes', function () {
    //   return Promise.all([
    //     Note.find({ userId: user.id })
    //       .populate('tags', 'name')
    //       .sort({ _id: 'asc' }),
    //     chai.request(app)
    //       .set('Authorization', `Bearer ${token}`)
    //       .get('/api/notes')
    //   ])
    //     .then(([data, res]) => {
    //       expect(res).to.have.status(200);
    //       expect(res).to.be.json;
    //       expect(res.body).to.be.a('array');
    //       expect(res.body).to.have.length(data.length);
    //       expect(res.body[1]).to.be.a('object');
    //       expect(res.body[1]).to.have.keys('id', 'title', 'content', 'tags', 'folderId', 'userId', 'createdAt', 'updatedAt');
    //     });
    // });

    it('should return correct search results for a searchTerm query', function () {
      let data;
      let res;

      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/notes?searchTerm=${data.title}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0]).to.have.keys('id', 'title', 'content', 'tags', 'userId', 'createdAt', 'updatedAt');
          return Note.findOne({ _id: res.body[0].id, userId: user.id });
        })
        .then(dbData => {
          expect(res.body[0].id).to.equal(dbData.id);
          expect(res.body[0].title).to.equal(dbData.title);
          expect(res.body[0].content).to.equal(dbData.content);
          expect(new Date(res.body[0].createdAt)).to.eql(dbData.createdAt);
          expect(new Date(res.body[0].updatedAt)).to.eql(dbData.updatedAt);
        });
    });

    it('should return correct search results for a folderId query', function () {
      let data;
      return Folder.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return Promise.all([
            Note.find({ folderId: data.id }),
            chai.request(app)
              .get(`/api/notes?folderId=${data.id}`)
              .set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return correct search results for a tagId query', function () {
      let data;
      return Tag.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return Promise.all([
            Note.find({ tags: data.id }),
            chai.request(app)
              .get(`/api/notes?tagId=${data.id}`)
              .set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      const searchTerm = 'NotValid';
      // const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note.find({
        title: { $regex: searchTerm, $options: 'i' }
        // $or: [{ title: re }, { content: re }]
      });
      const apiPromise = chai
        .request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct content for a given id', function () {
      let data;
      let res;
      return Note.findOne({ userId: user.id })
        .then((_data) => {
          data = _data;
          return chai
            .request(app)
            .get(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'tags', 'userId', 'createdAt', 'updatedAt');
          return Note
            .findOne({ _id: res.body.id, userId: user.id }).populate('tags', 'name');
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      return chai
        .request(app)
        .get('/api/notes/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai
        .request(app)
        .get('/api/notes/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });


  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        title: 'The best article about cats ever!',
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        folderId: '222222222222222222222201',
        tags: []
      };
      let res;
      // 1) First, call the API
      return Note.findOne({ userId: user.id })
        .then(result => {
          return chai.request(app)
            .post('/api/notes')
            .send(newItem)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'userId', 'folderId', 'tags', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findOne({ _id: res.body.id, userId: user.id }).populate('tags', 'name');
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when missing "folderId" field', function () {
      const newItem = {
        title: 'test',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        tags: 'test'
      };

      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `folderId` in request body');
        });
    });

    it('should return an error when missing "tags" field', function () {
      const newItem = {
        title: 'test',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: '222222222222222222222201'
      };

      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `tags` in request body');
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: 'NOT-A-VALID-ID',
        tags: ['333333333333333333333301']
      };
      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });

    it('should return an error when `tags` is not an array', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: '222222222222222222222201',
        tags: 123
      };
      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('`tags` is not an array');
        });
    });

    it('should return an error when a tags `id` is not valid ', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: '222222222222222222222201',
        tags: ['NOT-A-VALID-ID']
      };
      return chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
        });
    });
  });

  describe('PUT /api/notes/:id', function () {
    it('should update and return a note object when given valid data', function () {
      const updateItem = {
        title: 'PUT updated title'
      };

      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(data.folderId);
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      const updateData = {
        id: 'invalidId',
        title: 'PUT updated title',
        content: 'Updated content'
      };

      return Note.findOne({ userId: user.id }).populate('tags', 'name')
        .then(result => {
          updateData.folderId = null;
          updateData.tags = result.tags;
          return chai.request(app)
            .put('/api/notes/invalidId')
            .send(updateData)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('status', 'message');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const updateItem = {
        id: 'DOESNOTEXIST',
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: '222222222222222222222201',
        tags: []
      };
      return Note.findOne({ userId: user.id }).populate('tags', 'name')
        .then(result => {
          return chai.request(app)
            .put('/api/notes/DOESNOTEXIST')
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function () {
      const updateItem = {
        title: ''
      };
      return Note
        .findOne({ userId: user.id })
        .then(data => {
          updateItem.id = data.id;
          return chai
            .request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should unset a note folderId when provided a empty string', function () {
      const updateItem = {
        folderId: ''
      };
      let data;

      return Note.findOne({ folderId: { $exists: true } })
        .then((note) => {
          data = note;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.not.exist;
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const updateItem = {
        folderId: 'NOT-A-VALID-ID'
      };
      return Note.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const updateItem = {
        title: 'test',
        content: 'test',
        folderId: 'NOT-A-VALID-ID',
        tags: []
      };
      return Note.findOne({ userId: user.id })
        .then(data => {
          updateItem.id = data.id;
          return chai
            .request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });

    it('should return an error when a tags `id` is not valid ', function () {
      const updateItem = {
        title: 'randomTitle',
        tags: ['NOT-A-VALID-ID']
      };
      return Note.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The \'tag\' is not valid');
        });
    });
  });

  describe('DELETE /api/notes/:id', function () {
    it('should delete an item by id', function () {
      let id;

      return Note.findOne({ userId: user.id })
        .then(res => {
          id = res.id;
          return chai.request(app)
            .delete(`/api/notes/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .then(res => {
              expect(res).to.have.status(204);
              return Note.findOne({ _id: id, userId: user.id });
            })
            .then(data => {
              expect(data).to.equal(null);
            });
        });
    });
  });
});