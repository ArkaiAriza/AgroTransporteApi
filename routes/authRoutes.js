const passport = require('passport');
const querystring = require('querystring');

const mongoose = require('mongoose');
const User = mongoose.model('users');

module.exports = (app) => {
  //Initial Page
  app.get('/', (req, res) => {
    res.send({ Agrotransporte: 'Agrotransporte API.' });
  });

  //Oauth Flow
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google'),
    (req, res, next) => {
      const userData = {
        name: req.user.name,
        _id: req.user.id,
        photo: req.user.photo,
        email: req.user.email,
        googleId: req.user.googleId,
        userType: req.user.userType,
      };
      console.log(querystring.stringify(userData));
      console.log(req);
      res.redirect(
        `exp://192.168.0.103:19000?${querystring.stringify(userData)}`
      );
      /* res.redirect(`/agroapi/current_user`); */
    }
  );

  /* app.get('/auth/google/redirect', async (req, res, next) => {
    res.redirect('exp://fs-r8g.anonymous.agrotransporte.exp.direct');
  });*/

  //Functionalities

  app.get('/agroapi/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //user

  app.get('/agroapi/current_user/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
      console.log(user);
      res.send(user);
    });
  });

  app.put('/agroapi/user_type/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      if (req.body.userType) {
        if (userData.userType !== 'Not Selected') {
          userData.userType = req.body.userType;
          return userData.save(function (err) {
            if (!err) {
              console.log('user updated');
              return res.send({ status: 'OK', userData: userData });
            } else {
              if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
              } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
              }
              console.log(
                'Internal error(%d): %s',
                res.statusCode,
                err.message
              );
            }
          });
        } else {
          res.statusCode = 400;
          res.send({ error: 'User type already defined' });
        }
      } else {
        res.statusCode = 500;
        res.send({ error: 'Server error' });
      }
    });
  });
};
