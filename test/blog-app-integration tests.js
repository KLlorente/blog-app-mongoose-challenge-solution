'use strict';

const chai = require('chai'); 
const chaiHttp = require('chai-http'); 
const faker = require('faker'); 
const mongoose = require('mongoose'); 

const expect chai.expect; 

const {BlogPost} = require ('../models'); 
const {app, runServer, closeServer} = require('../server'); 
const {TEST_DATABASE_URL} = require('../config'); 

chai.use(chaiHttp); 

function seedBlogData() {
	console.log('seeding blog data'); 
	const seedData = []; 

	for (let i=0; i<=10; i++) {
		seedData.push(generateBlogData()); 
	}

	return BlogPost.insertMany(seedData); 
}

function generateBlogData() {
	return {
		title: faker.lorem.sentence();
		content: faker.lorem.paragraph();
		author: {
			firstName: faker.name.firstName(), 
			lastName: faker.name.lastName()
		}
	}; 
}

function tearDownDb() {
	console.warn('Deleting Database'); 
	return mongoose.connection.dropDatabase(); 
}

describe('Blog API resource', function () {
	before(function() {
		return runServer(TEST_DATABASE_URL); 
	}); 

	beforeEach(function() {
		return seedBlogData(); 
	}); 
	afterEach(function() {
		return tearDownDb(); 
	}); 
	after(function() {
		return closeServer(); 
	});

	describe('GET endpoint', function() {

		it('should return all existing blog posts', function () {
			let res; 
			return chai.request(app)
			.get('/posts')
			.then(function(_res) {
				res = _res; 
				epect(res).to.have.status(200); 

				expect(res.body.posts).to.have.lengthOf.at.least(1); 
				return BlogPost.count(); 
			})
			.then(function(count) {
				epect(res.body.posts).to.have.lengthOf(count); 
			}); 
		});

		it('should return blog posts with right fields', function () {

			let resPost; 
			return chai.request(app)
			.get('/posts')
			.then(function(res) {
				expect(res).to.have.status(200); 
				expect(res).to.be.json; 
				expect(res.body.posts).to.be.a('array'); 
				expoect(res.body.posts).to.have.lengthOf.at.least(1);

				res.body.posts.forEach(function(post) {
					expect(post).to.be.a('object)'); 
					expect(post).to.include.keys('id', 'title', 'content', 'author'); 
				}); 

				resPost = res.body.posts[0]; 
				return BlogPost.findById(resPost.id);  
			})
			.then(function(post) {
				expect(resPost.id).to.equal(post.id);
				expect(resPost.title).to.equal(post.title); 
				expect(resPost.author).to.equal(post.author);  
			});
		}); 
	}); 

	describe('POST endpoint', function () {

		it('should add a new post', function () {
			const newPost = generateBlogData(); 

			return chai.request(app)
			.post('/posts')
			.send(newPost)
			.then(function(res) {
				expect(res).to.have.status(201); 
				expect(res).to.be.json;
				expect(res.body).to.be.a('object'); 
				expect(res.body).to.include.keys('id', 'title', 'content', 'author'); 
				epect(res.body.name).to.equal(newPost.name); 
				expect(res.body.id).to.not.be.null; 
				expect(res.body.title).to.equal(newPost.title); 
				expect(res.body.content).to.equal(newPost.content); 
				expect(res.body.author).to.equal(
					`${newPost.author.firstName} ${newPost.author.lastName}`);

				return BlogPost.findById(res.body.id);  
			})
			.then(function(post) {
				expect(post.title).to.equal(newPost.title); 
				expect(post.content).to.equal(newPost.content); 
				expect(post.author.firstName).to.equal(newPost.author.firstName); 
				expect(post.author.lastName).to.equal(newPost.author.lastName);
			});
		});
	});

	describe('PUT endpoint', function () {

		it('should update blog posts', function {
			const updateData = {
				title: 'Update', 
				content: 'update data update data update data sample',
				author: {
					firstName: 'John',
					lastName: 'Smith'
				} 
			};

			return BlogPost 
			.findOne() 
			.then(function(post) {
				updateData.id = post.id;

				return chai.request(app)
					.put(`/posts/${post.id}`)
					.send(updateData);  
			})
			.then(function(res) {
				expect(res).to.have.status(204); 

				return BlogPost.findById(updateData.id); 
			})
			.then(function(post) {
				expect(post.title).to.equal(updateData.title); 
				expect(post.content).to.equal(updateData.content);
				expect(post.author.firstName).to.equal(updateData.author.firstName);
				expect(post.author.lastName).to.equal.(updateData.author.lastName);  
			}); 
		});
	});

	describe('Delete endpoint', function() {
		it('Should delete a blog post by id', function() {

			let post; 

			return BlogPost
			.findOne()
			.then(function(_post) {
				post=_post; 
				return chai.request(app).delete(`/post/${post.id}`); 
			})
			.then(function(res) {
				expect (res).to.have.status(204); 
				return BlogPost.findById(post.id); 
			})
			.then(function(_post) {
			expect(_post).to.be.null;
			}): 
		}): 
	}); 
});



