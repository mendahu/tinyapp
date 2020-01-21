const PORT = 8080;
const slugLen = 6; // sets length of short URL slugs
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { generateRandomString } = require('./helper');
const { urlDatabase } = require('./database');

//fire up server, set listening port, launch cookie parser, templating engine and body parser for POST requests
const app = express();
app.use(cookieParser());
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
      username: req.cookies["username"]
    };
    res.render("urls_error", templateVars);
  }
});

//Redirects to new shorten URL page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//Redirects to view an existing shortened URL page
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].url,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

//Redirects to index page of all shortened URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

//Will redirect to correct landing page based on login; for now goes to URL index
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//accepts POST request to delete URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let slug = req.params.shortURL;

  //check if URL exists
  if (slug in urlDatabase) {
    //delete the entry and redirect to index
    urlDatabase.delURL(slug);
    res.redirect("../");

  //otherwise send the user to the error page
  } else {
    let templateVars = {
      badURL: slug,
      username: req.cookies["username"]
    };
    res.render("urls_error", templateVars);
  }
});

//accepts POST requests to edit existing shortened URLs
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body["newURL"];

  //if the URL exists, update it
  if (shortURL in urlDatabase) {
    urlDatabase.updateURL(shortURL, longURL);
    res.redirect("./");
    
  //otherwise send to error page
  } else {
    let templateVars = {
      badURL: shortURL,
      username: req.cookies["username"]
    };
    res.render("urls_error", templateVars);
  }
  
  //send back to URL page
  res.redirect(`/urls/${shortURL}`);
});

//Accepts POST requests to add a new URL
app.post("/urls", (req, res) => {
  let slug = generateRandomString(slugLen);
  let longURL = req.body["longURL"];

  urlDatabase.addURL(slug, longURL);

  res.redirect(`/urls/${slug}`);
});

//Accepts POST requests to log user in by sending them a cookie
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect(`/urls`);
});

//Accepts POST requests to log user out by deleting their cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect(`/urls`);
});

//Server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});