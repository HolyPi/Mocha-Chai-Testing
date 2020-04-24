require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const ObjectID = require('mongodb').ObjectID

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

const SAMPLE_USER_ID = 'aaaaaaaaaaaa' // 12 byte string
const SAMPLE_MESSAGE_ID = 'kkkkkkkkkkkk'
const SAMPLE_MESSAGE_ID2 = 'eeeeeeeeeeee'

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})


describe('Message API endpoints', () => {
    beforeEach((done) => {
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: SAMPLE_USER_ID
        })

        const sampleMessage = new Message({
            title: "newmessage",
            body: "messagebody",
            _id: SAMPLE_MESSAGE_ID,
            author: SAMPLE_USER_ID
        })

        Promise.all([sampleUser.save(), sampleMessage.save()])
        .then(() => {
            done()
        })
        .catch(err => {
            throw err.message
        })

    })

    afterEach((done) => {
        const deletion1 = User.deleteMany({ username: ['myuser'] })
        const deletion2 = Message.deleteMany({ title: ["anothermessage", "newmessage"]})

        Promise.all([deletion1, deletion2])
        .then(() => {
        done()
        }).catch(err => {
        throw err.message
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if(err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("undefined")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {
            if(err) {done(err)}
            expect(res).to.have.status(200)
            expect(res.body).to.be.an("object")
            expect(res.body.title).to.equal("newmessage")
            expect(res.body.body).to.equal("messagebody")
            done()
        })
    })

    it('should post a new message', (done) => {
        chai.request(app)
        .post('/messages')
        .send({
            title: "anothermessage",
            body: "mymessagebody",
            author: SAMPLE_USER_ID,
            _id: SAMPLE_MESSAGE_ID2
        })
        .end((err, res) => {
            if(err) {done(err)}
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('title', 'anothermessage')

            Message.findOne({title: 'anothermessage'}).then(message => {
            expect(message).to.be.an('object')
            done()
            })
        })
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${SAMPLE_MESSAGE_ID}`)
        .send({title: 'newmessage'})
        .end((err, res) => {

            if(err) {done(err)}
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'newmessage')
            Message.findOne({title: 'newmessage'}).then(message => {
            expect(message).to.be.an('object')
            done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {

            if(err) {done(err)}
            expect(res.body.message).to.equal('Successfully deleted.')
            expect(res.body._id).to.equal(SAMPLE_MESSAGE_ID)

            Message.findOne({title: 'anothermessage'}).then(message => {
                expect(message).to.equal(null)
                done()
            })
        })
    })
})