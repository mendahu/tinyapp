//Some variables for use with the application
const PORT = process.env.PORT || 8080;

//import modules and requires helper apps
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getVisitorId } = require('./helper');
const { urlDatabase, users } = require('./database');

//fire up server, set listening port, launch cookie parser, templating engine and body parser for POST requests
const app = express();
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["soyuz-vostok-voskhod-molniya"],
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('views'));

/*****************
GET ROUTING
*****************/

//Redirect routing that provides actual redirection service
app.get("/u/:shortURL", (req, res) => {
  let slug = req.params.shortURL;

  //If URL doesn't exist, redirect user
  if (!urlDatabase[slug].slug === slug) {
    return res.render("urls_error", { slug, user: users[req.session.user_id] });
  }

  let visitorId = getVisitorId(req.cookies); // sets visitor Id to existing cookie or false
  if (!visitorId) {
    //if cookie doesn't exist, make one
    visitorId = generateRandomString(10);
    res.cookie("visitor_id", visitorId, { maxAge: 31536000});
  }

  //add visit to database log
  urlDatabase.logVisit(slug, visitorId);
  res.redirect(urlDatabase[slug].url);
});

//Redirects to new shorten URL page
app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.render("urls_new", { user: users[userId] })
    : res.redirect("/login");
});

//Redirects to view an existing shortened URL page
app.get("/urls/:shortURL", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie
  let user = users[userId];
  let shortURL = req.params.shortURL;

  //Check if the URL actually exists
  if (!urlDatabase[shortURL]) {
    let errorCode = 404;
    let errorMsg = "That shortened URL doesn't exist!";
    res.status(errorCode);
    return res.render("error", { user, errorMsg, errorCode });
  }

  //Check for credentials
  if (!(userId || urlDatabase[shortURL].userId === userId)) {
    let errorCode = 403;
    let errorMsg = "You must be logged in to view or edit your shortened URLs!";
    res.status(403);
    return res.render("error", { user, errorMsg, errorCode });
  }

  //If URL exists, user is logged in, and user owns URL, show it to them
  res.render("urls_show", { user, shortURL, urlProps: urlDatabase[shortURL]});
});

//Redirects to index page of all shortened URLs if logged in
app.get("/urls", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.render("urls_index", { urls: urlDatabase.userURLs(userId), user: users[userId] })
    : res.redirect("/login");
});

//Redirects to registration page
app.get("/register", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.redirect("/urls")
    : res.render("register", { user: users[req.session.user_id] });
});

//Redirects to login page
app.get("/login", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.redirect("/urls")
    : res.render("login", { user: users[req.session.user_id] });
});

//Redirects to either /urls or /login depending on if user is logged in or not
app.get("/", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.redirect("/urls")
    : res.redirect("/login");
});

/*****************
POST ROUTING
*****************/

//accepts POST request to delete URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie
  let user = users[userId];
  let shortURL = req.params.shortURL;

  //Check if the URL actually exists
  if (!urlDatabase[shortURL]) {
    let errorCode = 404;
    let errorMsg = "The shortened URL you're trying to delete doesn't exist!";
    res.status(errorCode);
    return res.render("error", { user, errorMsg, errorCode });
  }
  
  //Check for credentials
  if (!(userId || urlDatabase[shortURL].userId === userId)) {
    let errorCode = 403;
    let errorMsg = "You must be logged in to delete shortened URLs!";
    res.status(403);
    return res.render("error", { user, errorMsg, errorCode });
  }
  
  //Delete the URL and redirect the user
  urlDatabase.delURL(shortURL);
  res.redirect("../");
});

//accepts POST requests to edit existing shortened URLs
app.post("/urls/:shortURL", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie
  let user = users[userId];
  let shortURL = req.params.shortURL;
  let longURL = req.body["newURL"];

  //Check if the URL actually exists
  if (!urlDatabase[shortURL]) {
    let errorCode = 404;
    let errorMsg = "The shortened URL you're trying to change doesn't exist!";
    res.status(errorCode);
    return res.render("error", { user, errorMsg, errorCode });
  }
  
  //Check for credentials
  if (!(userId || urlDatabase[shortURL].userId === userId)) {
    let errorCode = 403;
    let errorMsg = "You must be logged in to edit shortened URLs!";
    res.status(403);
    return res.render("error", { user, errorMsg, errorCode });
  }
  
  //update the database and send user to url page
  urlDatabase.updateURL(shortURL, longURL);
  res.redirect(`/urls/${shortURL}`);
});

//Accepts POST requests to add a new URL
app.post("/urls", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie
  let user = users[userId];

  //IF the user is not logged in
  if (!userId) {
    let errorCode = 403;
    let errorMsg = "You must be logged in to create shorted URLs!";
    res.status(errorCode);
    return res.render("error", { user, errorMsg, errorCode });
  }

  //Add new URL and redirect to it
  let longURL = req.body["longURL"];
  let slug = urlDatabase.addURL(longURL, userId);
  res.redirect(`/urls/${slug}`);
});

//Accepts POST requests to register a user in the database
app.post("/register", (req, res) => {
  let { email, password } = req.body;
  let userId = users.getUserIdByEmail(email) || false;

  //checks if email or password were empty
  if (!(email || password)) {
    let errorCode = 400;
    let errorMsg = "Account creation requires a username and password";
    res.status(errorCode);
    return res.render("error", { user: "", errorMsg, errorCode });
  }

  //checks if email was already in use
  if (userId) {
    let errorCode = 400;
    let errorMsg = "That email already has an acccount!";
    res.status(errorCode);
    return res.render("error", { user: "", errorMsg, errorCode });
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
  let userId = users.getUserIdByEmail(email) || false;

  if (!(userId && users.verifyPass(email, password))) {
    let errorCode = 403;
    let errorMsg = "Incorrect username or password. Please try again!";
    res.status(errorCode);
    return res.render("error", { user: "", errorMsg, errorCode });
  }

  req.session["user_id"] = userId;
  res.redirect(`/urls`);
});

//Accepts POST requests to log user out by deleting their cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

app.get("*", (req, res) => {
  let user = users[req.session.user_id];
  let errorCode = 404;
  let errorMsg = "The page you requested doesn't exist!";
  res.status(errorCode);
  return res.render("error", { user, errorMsg, errorCode });
});

//Server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});