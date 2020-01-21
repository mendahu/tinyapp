//"database" to store url index and redirect counts
const urlDatabase = {
  "b2xVn2": { url: "http://www.lighthouselabs.ca", count: 0 },
  "9sm5xK": { url: "http://www.google.com", count: 0 },
  addURL: function(slug, longURL) {
    this[slug] = { url: longURL, count: 0 };
  },
  incrCount: function(slug) {
    this[slug].count++;
  },
  delURL: function(slug) {
    delete this[slug];
  }
};


module.exports = { urlDatabase };