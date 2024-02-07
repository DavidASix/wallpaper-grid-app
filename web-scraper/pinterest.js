const axios = require('axios');
const fs = require('file-system');
const download = require('download');
const mysql = require('mysql');
const crypto = require('crypto');
const ColorThief = require('colorthief');
var probe = require('probe-image-size');

let rqu = 'https://wallpaperaccess.com/hd-phone';
let baseUrl = 'https://wallpaperaccess.com/full/'

async function getPin() {
  try {
    let { data } = await axios.get(rqu);
    let imgArr = data.split("data-src=\"/full/")
    imgArr.shift();
    imgArr = imgArr.map((img, i) => img.split('\">')[0]);
    console.log(imgArr);
    console.log(imgArr.length);
    let dims = await probe(baseUrl + imgArr[0]);
    console.log(dims);
  } catch (err) {
    console.log('error ', err);
    console.log('error -------- ');
  }
}


getPin();
