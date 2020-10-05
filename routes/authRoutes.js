const passport = require('passport');
const querystring = require('querystring');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.send({ Agrotransporte: 'Agrotransporte API.' });
  });

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
        existing: req.authInfo.message,
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
};
