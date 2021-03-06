const { User, Url } = require('./classes');
const bcrypt = require('bcrypt');
const slugLen = 6; // sets length of short URL slugs
const { generateRandomString } = require('./helper');

//"database" to store url index and redirect counts
const urlDatabase = {

  //adds new URL
  addURL: function(longURL, userId) {
    let slug = generateRandomString(slugLen);
    let newUrl = new Url(slug, longURL, userId);
    let newUrlSlug = newUrl.slug;
    this[newUrlSlug] = newUrl;
    return slug;
  },

  //increments the count of a URL redirect
  logVisit: function(slug, visitorId) {
    let visit = {
      visitorId,
      timeStamp: new Date()
    };
    this[slug].visits.push(visit);
  },

  //changes a URL
  updateURL: function(slug, longURL) {
    this[slug].url = longURL;
  },

  //deletes a URL entry
  delURL: function(slug) {
    delete this[slug];
  },

  userURLs: function(userId) {
    let userURLs = {};
    for (const url in urlDatabase) {
      if (this[url].userId === userId) {
        userURLs[url] = this[url];
      }
    }
    return userURLs;
  }
};

//user database
const users = {

  //method adds new user given email and password. generates unique 8 digit alphanumeric ID
  addUser: function(email, password) {
    let newUser = new User(email, password);
    let newUserId = newUser.id;
    this[newUserId] = newUser;
    return newUserId;
  },

  getUserIdByEmail: function(email) {
    for (const user in this) {
      if (this[user]["email"] === email) {
        return this[user]["id"];
      }
    }
    return false;
  },

  verifyPass(email, password) {
    let userId = this.getUserIdByEmail(email);
    return (userId)
      ? bcrypt.compareSync(password, this[userId].password)
      : false;
  }

};

module.exports = { urlDatabase, users };