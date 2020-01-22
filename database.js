const { generateRandomString } = require('./helper');
const bcrypt = require('bcrypt');

//"database" to store url index and redirect counts
const urlDatabase = {

  //adds new URL
  addURL: function(slug, longURL, userId) {
    let dateStamp = new Date();
    let year = dateStamp.getFullYear();
    let month = dateStamp.getMonth() + 1;
    let day = dateStamp.getDate();
    this[slug] = { url: longURL, count: 0, date: year + "/" + month + "/" + day, userId };
  },

  //increments the count of a URL redirect
  incrCount: function(slug) {
    this[slug].count++;
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
    let randomID = generateRandomString(8);
    this[randomID] = {
      email,
      password,
      id: randomID,
    };
    return randomID;
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
    return (bcrypt.compareSync(password, this[userId].password));
  }

};

module.exports = { urlDatabase, users };