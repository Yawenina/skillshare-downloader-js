const fs = require('fs');
const path = require('path');
const process = require('process');
const cwd = process.cwd();

exports.hasCookie = function hasCookie() {
  const filePath = path.resolve(cwd, 'cookie.txt');
  return fs.existsSync(filePath);
}

exports.saveCookie = function saveCookie(cookie) {
  fs.writeFileSync(path.resolve(cwd, 'cookie.txt'), cookie);
}
