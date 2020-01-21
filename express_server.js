const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { generateRandomString } = require('./helper');
const { urlDatabase, incrCount } = require('./database');
const PORT = 8080;

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

    //increment count of redirects
    incrCount(slug);

    //send user on their way
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

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].url,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  let slug = req.params.shortURL;
  if (slug in urlDatabase) {
    delete urlDatabase[slug];
    res.redirect("../");
  } else {
    let templateVars = {
      badURL: slug,
      username: req.cookies["username"]
    };
    res.render("urls_error", templateVars);
  }
});

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

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});