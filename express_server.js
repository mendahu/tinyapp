const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    let randomInd = Math.floor(Math.random() * 62);
    randomString += chars[randomInd];
  }
  return randomString;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const urlCounter = {
  "b2xVn2": 0,
  "9sm5xK": 0
};

app.get("/u/:shortURL", (req, res) => {
  let slug = req.params.shortURL;
  if (slug in urlDatabase) {
    let longURL = urlDatabase[slug];
    urlCounter[slug]++;
    res.redirect(longURL);
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
    longURL: urlDatabase[shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    counts: urlCounter,
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
    urlDatabase[shortURL] = longURL;
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

  let shortenedURL = generateRandomString();

  let longURL = req.body["longURL"];
  let prefix = longURL.slice(0, 7);
  if (!(prefix === "http://")) {
    longURL = "http://" + longURL;
  }

  urlDatabase[shortenedURL] = longURL;
  urlCounter[shortenedURL] = 0;

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