# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Features

### Registration and Login

TinyApp supports user registration and login with an email and password.

NOTE: This application is for test purposes only. Make no assumptions about data safety. Do not use real email addresses or passwords.

!["Login Page"](https://github.com/mendahu/tinyapp/blob/master/docs/login.png?raw=true)

### Creating shortened URLs

Simply enter a full URL (including http://) into the field and click submit.

!["Create a new shortened URL"](https://github.com/mendahu/tinyapp/blob/master/docs/create.png?raw=true)

### Stats Page

Each shortened URL has a stats page which has the following features:
* Full URL
* Date URL was created
* Total redirects since URL was created
* Total unique device visits to your URL (tracked via a cookie)
* A field to update the URL for your shortened URL
* A list of all the visits with timestamps

!["View a URL stats page"](https://github.com/mendahu/tinyapp/blob/master/docs/show.png?raw=true)

### View your URLs

All the URLs you have created will be visible under "My URLs", including:
* Short URL slug
* Long URL
* Total redirects since URL was created
* Total unique device visits to your URL (tracked via a cookie)
* A button to "edit" the URL via the Stats page
* A delete button

!["View all your URLs"](https://github.com/mendahu/tinyapp/blob/master/docs/urls.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-parser
- cookie-session
- method-override

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.