// Utility functions for server //
const crypto = require('crypto');
const mysql = require('mysql');
const p = require('./p.js');

const dbConfig = {
	host: 'localhost',
	user: p.username,
	password: p.password,
	database: 'wallpaper'
};

var exports = module.exports;
const db = mysql.createConnection(dbConfig);


function genRandomString(length) {
  // Creates a salt
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // Convert to hexadecimal format
    .slice(0, length); // Return required number of characters
}

db.connect((err) => {
	if (err) return console.log('Error connecting: ', err);
	console.log('connected on uf');
});

exports.asyncQuery = (sql, args) => {
  let argArray = [sql];
	if (String(args)) argArray.push(args);
    return new Promise((reject, resolve) => {
      const cb = (resp, err) => {
              if (err) return reject(err);
              return resolve(resp);
      };
      argArray.push(cb);
      db.query(...argArray);
    });
}

exports.sleep = function (milliseconds) {
  // Sleep shuts down a functions progess for a preset number of milliseconds
  const start = new Date().getTime();
  for (let i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) { break; }
  }
};

exports.hashPass = function (pass, preSalted) {
  // Function that salt's and hashes the user's password, then returns the salt and hash in an Object
  // if preSalted is truthy it is a salt for a user's password which we got from the database, if that is the case we are decrypting the password
  // sleep is used to slow down request to discourage hack attempts
  // Learn about salt hashing
  /*
    https://www.youtube.com/watch?v=b4b8ktEV4Bg
    https://www.youtube.com/watch?v=8ZtInClXe1Q
    https://www.youtube.com/watch?v=sjEeqtZ7Tw4
  */
  // Chaning this function can have devastating effects on the entire application
  const salt = preSalted || genRandomString(25);
  const hash = crypto.createHmac('sha512', salt);
  hash.update(pass);
  const value = hash.digest('hex');
  exports.sleep(200);
  return { salt, value };
};
