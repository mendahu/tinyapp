const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { generateRandomString } = require('./helper');
const { urlDatabase, incrCount, delURL } = require('./database');

//fire up server, set listening port, launch cookie parser, templating engine and body parser for POST requests
const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//Redirect routing that provides actual redirection service
app.get("/u/:shortURL", (req, res) => {
  let slug = req.params.shortURL;

  //check if the shortened URL actually exists
  if (slug in urlDatabase) {
    let longURL = urlDatabase[slug].url;

    //increment count of redirects, send user on their way
    incrCount(slug);
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
    urls: urlDatabase,
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
    delURL(slug);
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
  
  let prefix = longURL.slice(0, 7);
  
  if (shortURL in urlDatabase) {
    
    if (!(prefix === "http://")) {
      longURL = "http://" + longURL;
    }
    urlDatabase[shortURL].url = longURL;
    res.redirect("./");
    
  } else {
    
    let templateVars = {
      badURL: shortURL,
      username: req.cookies["username"]
    };
    res.render("urls_error", templateVars);
  }
  
  
  
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console

  let shortenedURL = generateRandomString(6);

  let longURL = req.body["longURL"];
  let prefix = longURL.slice(0, 7);
  if (!(prefix === "http://")) {
    longURL = "http://" + longURL;
  }

  urlDatabase[shortenedURL].url = longURL;
  urlDatabase[shortenedURL].count = 0;

  res.redirect(`/urls/${shortenedURL}`);
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