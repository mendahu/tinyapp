//Generates a random alphanumeric string of any length for use to create a URL redirection

const generateRandomString = function(len) {

  //Set allowable values
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let randomString = "";

  //loop an amount of times equal to param passed through for length of output string
  for (let i = 0; i < len; i++) {
    let randomInd = Math.floor(Math.random() * 62);
    randomString += chars[randomInd];
  }
  
  return randomString;
};

//takes a cookie object and returns the visitor ID or a false if one doesn't exist
const getVisitorId = function(cookieObject) {
  if (cookieObject["visitor_id"]) {
    return cookieObject["visitor_id"];
  } else {
    return false;
  }
};

module.exports = { generateRandomString, getVisitorId };