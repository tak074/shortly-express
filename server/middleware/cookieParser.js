const Sessions = require('../models/session');

const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    // split using "; " and then it returns an array
    cookiesArr = req.headers.cookie.split('; ');
    for (var i = 0; i < cookiesArr.length; i++) {
      let currCookie = cookiesArr[i];
      let cookie = currCookie.split('=');
      req.cookies[cookie[0]] = cookie[1];
    }
  }
  next();
};

module.exports = parseCookies;