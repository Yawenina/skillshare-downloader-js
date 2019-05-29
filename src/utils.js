const fs = require('fs');
const path = require('path');
const process = require('process');
const cwd = process.cwd();
const cookiePath = path.resolve(cwd, 'cookie.txt');

exports.hasCookie = function hasCookie() {
  return fs.existsSync(cookiePath);
}

exports.saveCookie = function saveCookie(cookie) {
  fs.writeFileSync(cookiePath, cookie);
}

exports.readCookie = function saveCookie() {
  return fs.readFileSync(cookiePath, { encoding: 'utf-8'});
}
