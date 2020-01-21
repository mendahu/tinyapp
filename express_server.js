const PORT = process.env.PORT || 8080;
const slugLen = 6; // sets length of short URL slugs
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString } = require('./helper');
const { urlDatabase, users } = require('./database');

//fire up server, set listening port, launch cookie parser, templating engine and body parser for POST requests
const app = express();
app.use(cookieSession({
  name: 'session',
  keys: ["soyuz", "vostok", "voskhod", "molniya"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//Redirect routing that provides actual redirection service
app.get("/u/:shortURL", (req, res) => {
  let slug = req.params.shortURL;

  //check if the shortened URL actually exists
  if (urlDatabase[slug]) {
    let longURL = urlDatabase[slug].url;

    //increment count of redirects, send user on their way
    urlDatabase.incrCount(slug);
    res.redirect(longURL);

  //if URL doesn't exist, send user to error page
  } else {
    let templateVars = {
      badURL: slug,
      user: users[req.session.user_id]
    };
    res.render("urls_error", templateVars);
  }
});

//Redirects to new shorten URL page
app.get("/urls/new", (req, res) => {

  if (!req.session.user_id) {
    res.redirect("/login");
  }

  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

//Redirects to view an existing shortened URL page
app.get("/urls/:shortURL", (req, res) => {

  let userId = req.session.user_id;

  if (!userId) {
    res.redirect("/login");
  }
  
  let shortURL = req.params.shortURL;
  
  if (!(urlDatabase[shortURL].userId === userId)) {
    res.sendStatus(403);
  }

  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].url,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

//Redirects to index page of all shortened URLs
app.get("/urls", (req, res) => {

  let userId = req.session.user_id;

  if (!userId) {
    res.redirect("/login");
  }

  let templateVars = {
    urlDatabase: urlDatabase.userURLs(userId),
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

//Redirects to registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});

//Redirects to login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});

//Will redirect to correct landing page based on login; for now goes to URL index
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//accepts POST request to delete URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let slug = req.params.shortURL;
  let userId = req.session.user_id;

  if (!(urlDatabase[slug].userId === userId)) {
    return res.sendStatus(403);
  }
  
  //check if URL exists
  if (slug in urlDatabase) {
    //delete the entry and redirect to index
    urlDatabase.delURL(slug);
    res.redirect("../");

  //otherwise send the user to the error page
  } else {
    let templateVars = {
      badURL: slug,
      user: users[req.session.user_id]
    };
    res.render("urls_error", templateVars);
  }
});

//accepts POST requests to edit existing shortened URLs
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let userId = req.session.user_id;
  
  if (!(urlDatabase[shortURL].userId === userId)) {
    return res.sendStatus(403);
  }
  
  let longURL = req.body["newURL"];

  //if the URL exists, update it
  if (shortURL in urlDatabase) {
    urlDatabase.updateURL(shortURL, longURL);
    res.redirect("./");
    
  //otherwise send to error page
  } else {
    let templateVars = {
      badURL: shortURL,
      user: users[req.session.user_id]
    };
    res.render("urls_error", templateVars);
  }
  
  //send back to URL page
  res.redirect(`/urls/${shortURL}`);
});

//Accepts POST requests to add a new URL
app.post("/urls", (req, res) => {

  let userId = req.session.user_id;

  if (!userId) {
    res.sendStatus(403);
  }

  let slug = generateRandomString(slugLen);
  let longURL = req.body["longURL"];

  urlDatabase.addURL(slug, longURL, userId);

  res.redirect(`/urls/${slug}`);
});

//Accepts POST requests to register a user in the database
app.post("/register", (req, res) => {
  let { email, password } = req.body;

  //Checks if email and/or password strings were empty
  if (!(email || password)) {
    return res.sendStatus(400);
  }
  
  //checks if email was already in use
  if (users.getUserIdByEmail(email)) {
    return res.sendStatus(400);
  }

  let hashedPassword = bcrypt.hashSync(password, 10);

  //creates new user in the database and returns their new unique User ID for strategic cookie purposes
  let newUserId = users.addUser(email, hashedPassword);

  req.session["user_id"] = newUserId;
  res.redirect(`/urls`);
});

//Accepts POST requests to log user in by sending them a cookie
app.post("/login", (req, res) => {
  let { email, password } = req.body;

  //Checks if email and/or password strings were empty
  if (!(email || password)) {
    return res.sendStatus(400);
  }
  
  let userId = users.getUserIdByEmail(req.body.email) || false;

  if (userId && users.verifyPass(email, password)) {
    req.session["user_id"] = userId;
    res.redirect(`/urls`);
  } else {
    res.sendStatus(403);
    res.redirect(`/urls`);
  }

});

//Accepts POST requests to log user out by deleting their cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

//Server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});