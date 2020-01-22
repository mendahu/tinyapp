const { assert } = require('chai');
const { generateRandomString } = require('../helper');
const { urlDatabase, users } = require('../database');
const bcrypt = require('bcrypt');

describe('Helper Functions', function() {

  it('generateRandomString should return an alphanumeric key of the correct length', function() {

    let randomString = generateRandomString(6);

    assert.equal(randomString.length, 6);
  });
});

//Create a test user
const testUserId = users.addUser("test@test.com", bcrypt.hashSync("test", 10));

describe('Users Database', function() {

  it('addUser should create a new user object with an email property', function() {
    
    assert.isTrue("email" in users[testUserId]);
  });

  it('addUser should create a new user object with the correct email', function() {
    
    assert.equal(users[testUserId].email, "test@test.com");
  });

  it('addUser should create a new user object with a password property', function() {
    
    assert.isTrue("password" in users[testUserId]);
  });

  it('addUser should create a new user object with the correct hashed password', function() {
    
    assert.isTrue(bcrypt.compareSync("test", users[testUserId].password));
  });

  it('addUser should create a new user object with an id property', function() {

    assert.isTrue("id" in users[testUserId]);
  });
  
  it('addUser should create a new user object with the correct id', function() {
    
    assert.equal(users[testUserId].id, testUserId);
  });
  
  it('getUserIdByEmail Should return a valid user ID if given an email', function() {
    
    const userId = users.getUserIdByEmail("test@test.com");

    assert.equal(testUserId, userId);
  });
  
  it('getUserIdByEmail Should return false if the email does not belong to any user', function() {
    
    const noId = users.getUserIdByEmail("fake@fake.com");

    assert.isFalse(noId);
  });

  it('verifyPass should return true if passwords match', function() {
    
    assert.isTrue(users.verifyPass("test@test.com", "test"));
  });

  it('verifyPass should return false if passwords don\'t match', function() {
    
    assert.isFalse(users.verifyPass("test@test.com", "wrongpassword"));
  });
});

urlDatabase.addURL("w4hf8U", "http://www.wemartians.com", testUserId);

describe('URL Database', function() {

  it('addURL should create a new entry in the database with the right shortURL as the key', function() {
    
    assert.isTrue(urlDatabase["w4hf8U"].userId === testUserId);
  });

  it('addURL should create a new entry in the database with the right URL', function() {
    
    assert.isTrue(urlDatabase["w4hf8U"].url === "http://www.wemartians.com");
  });

  it('addURL should create a new entry in the database with 0 count', function() {
    
    assert.isTrue(urlDatabase["w4hf8U"].count === 0);
  });

  it('incrCount should increase the count to 1', function() {
    
    urlDatabase.incrCount("w4hf8U");

    assert.isTrue(urlDatabase["w4hf8U"].count === 1);
  });

  it('updateURL should change the URL', function() {
    
    urlDatabase.updateURL("w4hf8U", "http://www.rocket.com");

    assert.isTrue(urlDatabase["w4hf8U"].url === "http://www.rocket.com");
  });

  it('userURLs should return an object with all the URLs for that user', function() {
    
    let userURLs = urlDatabase.userURLs(testUserId);

    assert.isTrue(Object.keys(userURLs).length === 1);
  });

  it('userURLs should return an empty object for a user if they have no urls', function() {
    
    let userURLs = urlDatabase.userURLs("5g36fd3gg");

    assert.deepEqual(userURLs, {});
  });

  it('delURL should remove a url entry', function() {
    
    urlDatabase.delURL("w4hf8U");

    assert.deepEqual(urlDatabase.userURLs(testUserId), {});
  });

});