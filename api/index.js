const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const p = require('./p.js');

const app = express();
const port = 3002;
const comdbConfig = {
	host: 'localhost',
	user: p.username,
	password: p.password,
	database: 'com'
};

const comdb = mysql.createConnection(comdbConfig);

comdb.connect((err) => console.log(err || 'connected to com in index'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());


/* ------------ Helper functions Start ------------ */
function checkKey(req, res, next) {
  const webkey = String(req.body.webkey || '');
  // check provided key against private key
  if (webkey !== p.webkey) return res.status(403).send('Forbidden');
  // Continue to protected route
  next();
}

function verifyToken(req, res, next) {
  // This function takes the jwt which was sent via authentication header
  // 1: Authenication header was sent?
  // 2: JWT contains the JWTKey set in PData
  // 3: JWT is not denylisted (JWT would be denylisted if a use had used in and logged out) in the jwtblacklist table
  // If the JWT fails any of the three checks the request will return 403 - Forbidden
  const token = req.headers.authorization;
  req.body.jwtToken = token;
  console.log('Token: ', token);
  // 1: Check that the token exists
  if (!token) return res.status(403).send('🙅‍♂️ nope');
  // 2: Check that the token is valid with pData.jwtKey
  jwt.verify(token, p.jwtcom, (err, authData) => {
    if (err) return res.status(403).send('❕🤢 Seriously no');
    // 3: Check that the token has not been denylisted by a user
    comdb.query('SELECT * FROM jwtdenylist WHERE jwt = ?', token,
      (err, token) => {
        if (err) return res.status(500).send('serverError');
        else if (token.length) return res.status(403).send('log back in 🤡');
        // JWT is valid, append the UserID from the token onto the request body, so that we can check for the current user.
        req.body.tokenUserId = authData.userId;
        // Continue to protected route
        next();
    });
  });
}


//app.use('/com', require('./routes/com'));
//app.use('/comauthed',  verifyToken, require('./routes/com_authed'));

//app.use('/gas', require('./routes/gas'));
//app.use('/google', require('./routes/google'));
app.use('/wallpaper', require('./routes/wallpaper'));
//app.use('/thermoPi', require('./routes/thermoPi'));
//app.use('/stroller', checkKey, require('./routes/stroller'));

app.use((req, res) => { res.status(404).send('404 - Request Unknown, Sorry!'); });
app.listen(port, () => console.log(`Express Running on Port: ${port}`));
//ps aux | grep node
