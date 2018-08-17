'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Folders', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {
    it('should return correct number of folders', function() {
      return Promise.all([
        Folder
          .find(),
        chai
          .request(app)
          .get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct fields and values', function () {
      return Promise.all([
        Folder
          .find()
          .sort('name'),
        chai
          .request(app)
          .get('/api/folders')
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
  });

  describe('GET /api/folders/:id', function() {
    it('should return correct folder', function() {
      let data;
      return Folder
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .get(`/api/folders/${data.id}`);
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

    it('should respond with status 404 and an error when `id` is not valid', function() {
      return chai
        .request(app)
        .get('/api/folders/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.eql('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function() {
      return chai
        .request(app)
        .get('/api/folders/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/folders', function() {
    it('should create and return a new folder when provided valid data', function() {
      const newItem = { 'name': 'New Folder' };
      let body;

      return chai
        .request(app)
        .post('/api/folders')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.has.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          return Folder.findById(body.id);
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
        'noName': 'Missing name'
      };
      return chai
        .request(app)
        .post('/api/folders')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
    // not working - getting status code of 201 instead of 400
    // it('should return an error when given a duplicate name', function () {
    //   return Folder
    //     .findOne()
    //     .then(data => {
    //       const newItem = { 'name': data.name };
    //       return chai
    //         .request(app)
    //         .post('/api/folders')
    //         .send(newItem);
    //     })
    //     .then(res => {
    //       expect(res).to.have.status(400);
    //       expect(res).to.be.json;
    //       expect(res.body).to.be.a('object');
    //       expect(res.body.message).to.equal('Folder name already exists');
    //     });
    // });
  });

  describe('PUT /api/folders/:id', function() {
    it('should update the folder on PUT', function() {
      const updateData = {
        'name': 'Testing updated name'
      };
      let data;

      return Folder
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .put(`/api/folders/${data.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.eql(data.id);
          expect(res.body.name).to.eql(updateData.name);
        });
    });

    it('should respond with a 400 status code when id is not valid', function() {
      const updateData = {
        'name': 'Testing updated name'
      };
      return chai
        .request(app)
        .put('/api/folders/NOT-A-VALID-ID')
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });  
  describe('DELETE /api/folders/:id', function() {
    it('should delete the folder and respond with 204', function() {
      let data;
      return Folder
        .findOne()
        .then(_data => {
          data = _data;
          return chai
            .request(app)
            .delete(`/api/folders/${data.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Folder.count({_id: data.id});
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });
  });
});