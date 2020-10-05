const passport = require('passport');
const querystring = require('querystring');
const requireLogin = require('../middlewares/requireLogin');

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
      res.redirect(
        `exp://192.168.0.103:19000?${querystring.stringify(userData)}`
      );
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

  app.get('/agroapi/current_user', (req, res) => {
    console.log(req.user);
    res.send(req.user);
  });
};
