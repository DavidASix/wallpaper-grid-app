const axios = require('axios');
const fs = require('file-system');
const download = require('download');
const mysql = require('mysql');
const crypto = require('crypto');
const ColorThief = require('colorthief');
var probe = require('probe-image-size');
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


// Arguments: Maximum number of images to be taken, current array of images, current page index
function getUnsplashImages(cat, maxNumberImages = 100, imageArray = [], i = 0) {
	const itemsPerPage = 100;
	console.log(imageArray.length)
	return new Promise(async (resolve, reject) => {
  	let napiURL = (j) => (`https://unsplash.com/napi/collections/${cat}/photos?page=${j}&per_page=${itemsPerPage}&orientation=portrait&order_by=latest`);
    // Create image array to be used in recursian
    let recursedImageArray = [...imageArray]
		try {
      // Get images for page
			console.log('Trying Page: ', i);
			let { data } = await axios.get(napiURL(i));
      // If no more images, or maximum images pulled, throw and return array
			if (!data.length) throw 'last page';
			if (imageArray.length >= maxNumberImages) throw 'Maximum Images';
			recursedImageArray = [...recursedImageArray, ...data.map((image) => (image.urls.regular))];
      // There are more images, recruse with next page ID
      return resolve(getUnsplashImages(cat, maxNumberImages, recursedImageArray, i + 1))
		} catch (err) {
		   	return resolve(recursedImageArray);
		}
	});
}

function getWallpaperAccess(domain) {
	// Returns an array of image objects from wallpaperaccess
	let baseUrl = 'https://wallpaperaccess.com/'
	return new Promise(async (resolve, reject) => {
	  try {
	    let { data } = await axios.get(`${baseUrl}${domain}`);
	    let imgArr = data.split("data-src=\"/full/")
	    imgArr.shift();
	    imgArr = imgArr.map((img, i) => baseUrl + 'full/' + img.split('\"')[0]);
			resolve(imgArr);
	  } catch (err) {
			reject(err);
	  }
	});
}

function createImageObjects(imageArray) {
	// Accepts an array of Image URL's and outputs an array of objects with image Metadata
	return new Promise(async (resolve, reject) => {
		let imageObjects = []
		const intToHex = (int) => int.toString(16).length < 2 ? '0' + int.toString(16) : int.toString(16);
		try {
			await asyncForEach(imageArray, async (image, i) => {
				console.log('Processing Image: ', i);
				try {
					let color;
					try {
						color = await ColorThief.getColor(image);
						color = '#' + intToHex(color[0]) + intToHex(color[1]) + intToHex(color[2]);
					} catch (err) {
						console.log('Color Error: ', err);
						color = '#d6d6d6';
					}
					let meta = await probe(image);
					// Hash will allow us to compare the original URL hashd to ensure that no duplicates are downloaded
					// URL is hashed to store to create a constant string length
					let hash = crypto.createHash('md5').update(image).digest('hex');
					imageObjects.push({
							height: meta.height,
							width: meta.width,
							color: color,
							bytes: meta.length,
							mime: meta.mime,
							type: meta.type,
							url: image,
							hash,
							title: randomString()
						});
				} catch (err) {
					console.log('Error with', i, ' image: ', image);
					console.log('Error processing object: ', err);
				}
			});
			resolve(imageObjects)
		} catch (err) {
			console.log('Err: ', err);
			reject('Error creating objects');
		}
	});
}
/*
function getCategory() {
	return new Promise(async (resolve, reject) => {
			try {
				let { data } = await axios.get(`https://unsplash.com/collections/${cat}`);
				let title = data.split('_3abvh">')[1].split('</div>')[0];
				title = title.replace('amp;', '')
				return resolve({
					title,
					slug: title.split(' ').map((word, i) => (i ? word.charAt(0).toUpperCase() + word.substr(1) : word.toLowerCase())).join('')
				});
			} catch (err) {
				return reject('title unavailable');
			}
	});
}
*/
function downloadImages(images, category) {
	return new Promise(async (resolve, reject) => {
		try {
			/*** Category Block ***/
			// Check if category slug is stored
			let categoryId = await asyncQuery('SELECT id FROM category WHERE slug = ?', category.slug);
			categoryId = categoryId[0];
			if (!categoryId) {
				// If title is not stored store it
				categoryId = await asyncQuery('INSERT INTO category SET ?', category);
				categoryId.id = categoryId.insertId;
				console.log('New title Stored');
			}
			categoryId = categoryId.id;
			/*** Category Block End ***/

			// Loop over formatted image array from getImageObjects()
			await asyncForEach(images, async (image, i) => {
				try {
					/*** Image Validation Block ***/
					// Do not store landscape images
					if (!image) throw 'EmptyImage';
					if (image.height/image.width < 1.4) throw 'Short Image';

					// Check if image hash has been stored before
					let imgHash = await asyncQuery('SELECT id, title FROM images WHERE hash = ?', image.hash);
					if (imgHash.length) {
						try {
							// Image has been downloaded before
							// Check if image is joined with current category
							let categoryImageJoinExists = await asyncQuery('SELECT * FROM categoryImageJoin WHERE categoryId = ? AND imageId = ?', [categoryId, imgHash[0].id]);
							if (!categoryImageJoinExists.length) {
								// If file is not joined with current category, joing it.
								await asyncQuery('INSERT INTO categoryImageJoin SET ?', { categoryId, imageId: imgHash[0].id });
								console.log('Joined downloaded image with new category')
							}
						} finally { throw 'File Exists'; }
					}
					/*** Image Validation Block End ***/

					/*** Image Storage Block ***/
					// Save images to hard drive
					let full = await download(image.url);
					fs.writeFileSync(`./images/${image.title}.${image.type}`, full);

					// Set up object to get stored
					let sqlBody = {
						title: image.title,
						color: image.color,
						height: image.height,
						width: image.width,
						bytes: image.bytes,
						mime: image.mime,
						type: image.type,
						hash: image.hash,
					};
					// Save images to sql database
					let imageStored = await asyncQuery('INSERT INTO images SET ?', sqlBody);
					await asyncQuery('INSERT INTO categoryImageJoin SET ?', { categoryId, imageId: imageStored.insertId });
					console.log(image.title, 'Saved to server and SQL');
					/*** Image Storage Block End ***/

				} catch (err) {
					console.log(image.title, 'Failed to save because:', err);
				}
			});
		} catch (err) {
			console.log('Download Failure: ', err);
			throw 'Error getting Category';
			return reject(err);
		}
	});
}


/*
WallpaperAccess:
bleach-anime-phone
anime-phone
cute-anime-phone
beautiful-hd-anime-phone

let category = { title: 'Super Hero', slug: 'superHero' };
superhero-phone
deadpool-phone
spider-man-phone
hulk-phone
superhero-iphone

let category = { title: 'Cars', slug: 'cars' };
matte-black-car
car-phone
classic-car-phone
sport-car-phone
car-phone-hd

let category = { title: 'Kawaii', slug: 'kawaii' };
kawaii-phone
kawaii-iphone
cute-japanese
kawaii-japanese
kawaii

let category = { title: 'Dope & Trill', slug: 'dopeAndTrill' };
most-dope
supreme-iphone
dope-iphone
dope-swag-iphone
dope-trill-iphone
trill-girl

let category = { title: 'Urban', slug: 'urban' };
574331
784855
135653

*/


// Nature Collection: 3330448
// Stranger Things Collection 6780963
// Dark and moody 762960
// Texture 3330445
// Animals 3330452
// Food 3330455
// white 1127156
// pink 1130879


async function runDownload() {
	let category = { title: 'Urban', slug: 'urban' };
	try {
		//let images = await getWallpaperAccess('trill-girl');
		let images = await getUnsplashImages('135653', 200);

		images = images;
		console.log('Calling get meta data for: ', images.length, ' Images');
		let metaDataObjects = await createImageObjects(images);
		console.log('------------------- We have prepared: ', metaDataObjects.length, ' images');
		await downloadImages(metaDataObjects, category);
	} catch (err) {
		console.log(err);
	}
}

runDownload();
