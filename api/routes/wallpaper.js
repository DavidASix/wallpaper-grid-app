const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
const crypto = require('crypto');
const p = require('./p.js');


const dbConfig = {
	host: 'localhost',
	user: p.username,
	password: p.password,
	database: 'wallpaper'
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => console.log(err || 'connected'));

const randomString = (length = 16) => {
  // Creates a large random string and returns it cut to a provided length, default 16
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // Convert to hexadecimal format
    .slice(0, length); // Return required number of characters
}

function asyncQuery(sql, arg1) {
	return new Promise((reject, resolve) => {
		let argArray = Object.values(arguments);
		const cb = (resp, err) => {
			if (err) return reject(err);
			return resolve(resp);
		};
		argArray.push(cb);
		db.query(...argArray);
	});
}

function asyncForEach(array, callback) {
  return new Promise( async(resolve, reject) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
    return resolve();
  });
}

const router = express.Router();
// category

/*
MySql tables:

|  category  |
|  id  |  title  |  sluge  |
CREATE TABLE
	category(
		id INT AUTO_INCREMENT,
		title VARCHAR(256),
		slug VARCHAR(256),
		PRIMARY KEY (id))

|  categoryImageJoin  |
|  id  |  categoryId  |  imageId  |
CREATE TABLE
	categoryImageJoin(
		id INT AUTO_INCREMENT,
		categoryId INT,
		imageId INT,
		FOREIGN KEY (categoryId) REFERENCES category(id),
    FOREIGN KEY (imageId) REFERENCES images(id),
		PRIMARY KEY (id))

	|  images  |
	|  id  |  uid  |  email  |  restoreKey  |  apps.package  |
	CREATE TABLE
		images(
			id INT AUTO_INCREMENT,
			title VARCHAR(16),
			color VARCHAR(7),
			height INT DEFAULT 400,
			width INT DEFAULT 200,
			bytes BIGINT DEFAULT 0,
			mime VARCHAR(16),
			type VARCHAR(16),
			hash VARCHAR(32),
			sets INT DEFAULT 0,
			downloads INT DEFAULT 0,
			views INT DEFAULT 0,
			created DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id))
	*/


router.get('/getCategories', async (req, res) => {
	console.log('get categories');
	try {
		// Get all categories
		let categories = await asyncQuery('SELECT * FROM category ORDER BY title ASC');
		let formattedCategories = [];
		await asyncForEach(categories, async (category, i, a) => {
			let image = await asyncQuery(`SELECT * FROM images WHERE id IN(
				SELECT imageId FROM categoryImageJoin WHERE categoryId = ?) ORDER BY views DESC LIMIT 1`, category.id);
			let count = await asyncQuery(`SELECT COUNT(*) FROM categoryImageJoin WHERE categoryId =? `, category.id);
			formattedCategories.push({
				...category,
				coverImage: image[0],
				count: count[0]['COUNT(*)']
			});
		});
		res.send(formattedCategories);
	} catch (err) {
		console.log('Error getting Categories: ', err);
		return res.status(500).send('Oof! Error getting categories.');
	}
});

router.post('/getCategoryImages', async (req, res) => {
	try {
		let categoryId = String(req.body.categoryId || '');
		if (!categoryId) throw 'No category selected';
		let categoryImages = await asyncQuery(
			`SELECT * FROM images WHERE id
				IN(SELECT imageId FROM categoryImageJoin WHERE categoryId = ?)
				ORDER BY created DESC`, categoryId);
		return res.send(categoryImages);
	} catch (err) {
		console.log('Error getting images: ', err);
		return res.status(500).send('Oof! Error getting categoryImages');
	}
});

router.get('/getHotImages', async (req, res) => {
	try {
		let hotImages = await asyncQuery(
			`SELECT * FROM images ORDER BY views DESC LIMIT 100`);
		return res.send(hotImages);
	} catch (err) {
		console.log('Error getting hot images: ', err);
		return res.status(500).send('Oof! Error getting Hot Images');
	}
});

router.get('/getRandomImage', async (req, res) => {
	try {
		let randomImage = await asyncQuery(
			`SELECT * FROM images ORDER BY RAND() LIMIT 1`);
		return res.send(randomImage[0]);
	} catch (err) {
		console.log('Error getting random image: ', err);
		return res.status(500).send('Oof! Error getting Random Image');
	}
});

router.post('/incrementImageViews', async (req, res) => {
	try {
		let imageId = String(req.body.imageId || '');
		if (!imageId) throw 'No Image Selected';
		await asyncQuery('UPDATE images SET views = views + 1 WHERE id = ?', imageId);
		res.send(true);
	} catch (err) {
		console.log('Error incrementing view count', err);
		return res.status(500).send('Unable to Increment Views')
	}
});

router.post('/incrementImageDownloads', async (req, res) => {
	try {
		let imageId = String(req.body.imageId || '');
		if (!imageId) throw 'No Image Selected';
		await asyncQuery('UPDATE images SET downloads = downloads + 1 WHERE id = ?', imageId);
		res.send(true);
	} catch (err) {
		console.log('Error incrementing downloads count', err);
		return res.status(500).send('Unable to Increment Downloads')
	}
});

router.post('/incrementImageSets', async (req, res) => {
	try {
		let imageId = String(req.body.imageId || '');
		if (!imageId) throw 'No Image Selected';
		await asyncQuery('UPDATE images SET sets = sets + 1 WHERE id = ?', imageId);
		res.send(true);
	} catch (err) {
		console.log('Error incrementing sets count', err);
		return res.status(500).send('Unable to Increment Sets')
	}
});

module.exports = router;
