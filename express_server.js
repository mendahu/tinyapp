//Some variables for use with the application
const PORT = process.env.PORT || 8080;
const slugLen = 6; // sets length of short URL slugs

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

//Redirects to either /urls or /login depending on if user is logged in or not
app.get("/", (req, res) => {
  let userId = req.session.user_id; //gets userId from login cookie

  (userId)
    ? res.redirect("/urls")
    : res.redirect("/login");
    
});

//accepts POST request to delete URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let slug = req.params.shortURL;
  let userId = req.session.user_id;

  if (!(urlDatabase[slug].userId === userId)) {
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 403,
      errorMsg: "This short URL doesn't belong to you! If you think that's wrong, please ensure you're logged in with the correct account."
    };

    res.status(403);
    return res.render("error", templateVars);
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
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 403,
      errorMsg: "This short URL doesn't belong to you! If you think that's wrong, please ensure you're logged in with the correct account."
    };

    res.status(403);
    return res.render("error", templateVars);
  }
  
  let longURL = req.body["newURL"];

  //if the URL exists, update it
  if (shortURL in urlDatabase) {
    urlDatabase.updateURL(shortURL, longURL);
    
  //otherwise send to error page
  } else {
    let templateVars = {
      badURL: shortURL,
      user: users[req.session.user_id]
    };
    return res.render("urls_error", templateVars);
  }
  
  //send back to URL page
  res.redirect(`/urls/${shortURL}`);
});

//Accepts POST requests to add a new URL
app.post("/urls", (req, res) => {

  let userId = req.session.user_id;

  if (!userId) {
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 403,
      errorMsg: "You must be logged in to create shorted URLs!"
    };

    res.status(403);
    return res.render("error", templateVars);
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
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 400,
      errorMsg: "Either your email or password fields were empty! Try again."
    };

    res.status(400);
    return res.render("error", templateVars);
  }
  
  //checks if email was already in use
  if (users.getUserIdByEmail(email)) {
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 400,
      errorMsg: "That email already has an acccount!"
    };

    res.status(400);
    return res.render("error", templateVars);
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
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 400,
      errorMsg: "Either your email or password fields were empty! Try again."
    };

    res.status(400);
    return res.render("error", templateVars);
  }
  
  let userId = users.getUserIdByEmail(req.body.email) || false;

  if (userId && users.verifyPass(email, password)) {
    req.session["user_id"] = userId;
    res.redirect(`/urls`);
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      errorCode: 403,
      errorMsg: "Incorrect username or password. Please try again!"
    };

    res.status(403);
    return res.render("error", templateVars);
  }

});

//Accepts POST requests to log user out by deleting their cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

app.get("*", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    errorCode: 404,
    errorMsg: "The page you requested doesn't exist!"
  };

  res.status(404);
  return res.render("error", templateVars);
});

//Server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});