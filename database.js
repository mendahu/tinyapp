const { generateRandomString } = require('./helper');

//"database" to store url index and redirect counts
const urlDatabase = {
  "b2xVn2": { url: "http://www.lighthouselabs.ca", count: 0 },
  "9sm5xK": { url: "http://www.google.com", count: 0 },

  //adds new URL
  addURL: function(slug, longURL) {
    this[slug] = { url: longURL, count: 0 };
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
    return (this[this.getUserIdByEmail(email)].password === password);
  }

};

module.exports = { urlDatabase, users };