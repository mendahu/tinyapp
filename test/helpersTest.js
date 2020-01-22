const { assert } = require('chai');
const { generateRandomString } = require('../helper');
const { urlDatabase, users } = require('../database');

describe('Helper Functions', function() {

  it('generateRandomString should return an alphanumeric key of the correct length', function() {

    let randomString = generateRandomString(6);

    assert.equal(randomString.length, 6);
  });
});

//Create a test user
const testUserId = users.addUser("test@test.com", "test");

describe('Users Database', function() {
  
  it('getUserIdByEmail Should return a valid user ID if given an email', function() {
    
    const userId = users.getUserIdByEmail("test@test.com");

    assert.equal(testUserId, userId);
  });

  
});