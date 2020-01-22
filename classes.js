const { generateRandomString } = require('./helper');

class User {

  constructor(email, password) {
    this.id = generateRandomString(8);
    this.email = email;
    this.password = password;
  }
}

class Url {

  constructor(slug, longUrl, userId) {
    let dateStamp = new Date();
    let year = dateStamp.getFullYear();
    let month = dateStamp.getMonth() + 1;
    let day = dateStamp.getDate();
    this.slug = slug;
    this.userId = userId;
    this.url = longUrl;
    this.date = year + "/" + month + "/" + day,
    this.visits = [];
  }

  get visitCount() {
    return this.visits.length;
  }
}

module.exports = { User, Url };