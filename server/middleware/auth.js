const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
// Sessions.create() creates cookies
// if req.cookies
// else {
  // query select users.id from users, where
  // console.log(models.Sessions.create());
  Promise.resolve(req.cookies.shortlyid)
    .then((hash) => {
      if (!hash) {
        console.log('error hash not found');
        throw hash;
      }
      return models.Sessions.get({hash});
    })
    .then((session) => {
      if (!session) {
        console.log('error session not found');
        throw session;
      }
      return session;
    })
    .catch(() => {
      return models.Sessions.create()
        .then(results => {
          return models.Sessions.get({id: results.insertId});
        })
        .then(session => {
          res.cookie('shortlyid', session.hash);
          return session;
        });
    })
    .then((session) => {
      req.session = session;
      next();
    });
  };

  // if (!!req.cookies.shortlyid) {
  //   res.cookies = {'shortlyid': {'value': req.cookies.shortlyid}};
  //   models.Sessions.get({hash: req.cookies.shortlyid})
  //     .then ((session) => {
  //       req.session = {hash: session};
  //     })
  //     .done(() => {
  //       next();
  //     });
  //   // if (!req.session) {
  //   //   return;
  //   // }
  // //   // next();
  // } else {
  //   return models.Sessions.create()
  //     .then((hash) => {
  //       res.cookies = {'shortlyid': {value: hash}};
  //       req.session = {hash: hash};
  //     }
  //     )
  //     .done(() => {
  //       next();
  //     });
  // }
// }

// };

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

// 'SELECT id from users WHERE (username = {input})'
