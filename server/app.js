const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const CookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));


app.use(require('./middleware/cookieParser'));
app.use(Auth.createSession);


app.get('/', Auth.verifySession,
(req, res) => {
  res.render('index');
});

app.get('/create', Auth.verifySession,
(req, res) => {
  res.render('index');
});

app.get('/links', Auth.verifySession,
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', Auth.verifySession,
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup',
// callback function (Sessions.create)
  (req, res, next) => {
    return models.Users.get({username: req.body.username})
      .then(user => {
        if (user) {
          throw 'username already exists';
        }
        return models.Users.create({username: req.body.username,
          password: req.body.password});
      })
      .then((results) => {
        return models.Sessions.update({hash: req.session.hash}, {userId: results.insertId});
      })
      .then(() => {
        res.redirect('/login');
      })
      .catch((error) => {
        res.redirect('/signup');
      });
    // next();
  });
  // (req, res, next) => {
  //   Auth.createSession(req, res, next);

  // });

app.post('/login',
  (req, res, next) => {
    var username = req.body.username;
    var passwordAttempt = req.body.password;

    return models.Users.get({username})
      .then((user) => {
        if (!user || !models.Users.compare(passwordAttempt, user.password, user.salt)) {
          throw 'password and username do no match';
        }
        return models.Sessions.update({hash: req.session.hash}, {userId: user.id});
      })
      .then(() => {
        res.redirect('/');
      })
      .catch(() => {
        res.redirect('/login');
      });
  });

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/
app.get('/logout', (req, res, next) => {
  //remove cookie
  models.Sessions.delete({hash: req.cookies.shortlyid})
    .then(() => {
      res.clearCookie('shortlyid');
      res.redirect('/login');
    })
    .error(error => {
      res.status(500).send(error);
    });
});


app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
