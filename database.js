//"database" to store url index and redirect counts
const urlDatabase = {
  "b2xVn2": { url: "http://www.lighthouselabs.ca", count: 0 },
  "9sm5xK": { url: "http://www.google.com", count: 0 }
};

const incrCount = function(slug) {
  urlDatabase[slug].count++;
};

const delURL = function(slug) {
  delete urlDatabase[slug];
};

module.exports = { urlDatabase, incrCount, delURL };