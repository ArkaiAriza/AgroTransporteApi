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
        id: req.user.id,
        photo: req.user.photo,
        email: req.user.email,
        googleId: req.user.googleId,
        userType: req.user.userType,
      };
      console.log(querystring.stringify(userData));
      console.log(req);
      /* res.redirect(
        `exp://192.168.0.103:19000?${querystring.stringify(userData)}`
      ); */
      res.redirect(`/agroapi/current_user`);
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

  app.put('/agroapi/add_type/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
      user.userType = req.body.userType;
      console.log(user);
      return user.save().then((userResult) => {
        res.send(userResult);
        done(null, userResult);
      });
    });
  });
};
