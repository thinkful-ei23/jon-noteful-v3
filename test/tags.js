'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Tags', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Tag.insertMany(seedTags),
      Tag.createIndexes() // look more into it
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {
    it('should return all tags', function() {
      return Promise.all([
        Tag
          .find(),
        chai
          .request(app)
          .get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          expect(res.body).to.have.lengthOf.at.least(1);
        });
    });

    it('should return a list with the correct fields and values', function () {
      return Promise.all([
        Tag
          .find()
          .sort('name'),
        chai
          .request(app)
          .get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    // it('should return 404 for bad path', function() {
    //   return chai
    //     .request(app)

  });
  

  describe('GET /api/tags/:id', function () {
    it('should return the correct tag', function () {
      let data;
      return Tag
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 404 when `id` is not valid', function() {
      return chai
        .request(app)
        .get('/api/tags/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      return chai
        .request(app)
        .get('/api/tags/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  
  });

  describe('POST /api/tags', function() {
    it('should create and return a new tag', function() {
      const newItem = { 'name': 'new tag' };
      let body;

      return chai
        .request(app)
        .post('/api/tags')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.has.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          return Tag.findById(body.id);
        })
        .then(data => {
          expect(body.id).to.equal(data.id);
          expect(body.name).to.equal(data.name);
          expect(new Date(body.createdAt)).to.eql(data.createdAt);
          expect(new Date(body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return error when name is missing', function() {
      const newItem = {
        'noName': 'missing name'
      };
      return chai
        .request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Tag
        .findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai
            .request(app)
            .post('/api/tags')
            .send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Tag name already exists');
        });
    });

    // it('should return a 404 for a bad path', function() {
    //   const newItem = {'name': 'Testing name'};
    //   return chai.request(app).post('api/taggs').send(newItem)
    //     .then(res => {
    //       expect(res).to.have.status(404);
    //     });
    // });
  });

  describe('PUT /api/tags/:id', function() {
    it('should update the tag on PUT', function () {
      const updateData = {
        'name': 'Testing updated name'
      };
      let data;

      return Tag
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateData);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.eql(data.id);
          expect(res.body.name).to.eql(updateData.name);
        });
    });

    it('should respond with a 400 status code when id is not valid', function() {
      const updateData = {'name': 'Testing updated name'};
      return chai
        .request(app)
        .put('/api/tags/NOT-A-VALID-ID')
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should return an error when given a duplicate name', function() {
      return Tag.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/tags/${item1.id}`)
            .send(item1);
        })
        .then(res => {
          expect(res).to.has.status(400);
          expect(res).to.be.json;
          expect(res).to.be.a('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      return chai
        .request(app)
        .get('/api/tags/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('DELETE /api/tags/:id', function() {
    it('should delete the tag and respond with 204', function() {
      let data;
      return Tag
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .delete(`/api/tags/${data.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Tag.count({_id: data.id});
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });
  });
});
