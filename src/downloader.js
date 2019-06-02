// TODO: catch (https) errors
// TODO: escape title
// TODO: skip exist course
// TODO: user can define where to save
// TODO: trim user inputs and ids

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const Utils = require('./utils');
const request = require('request-promise');
const DraftLog = require('draftlog');

DraftLog(console);

const config = {
  cookie: '',
  outputDir: ''
};

async function downloadCourseById(courseId) {
  const { cookie, outputDir } = config;
  // 1. request for course info
  const data = await request.get({
    uri: `https://api.skillshare.com/classes/${courseId}`,
    headers: {
      'Accept': 'application/vnd.skillshare.class+json;,version=0.8',
      'User-Agent': 'Skillshare/4.1.1; Android 5.1.1',
      'Host': 'api.skillshare.com',
      cookie
    },
    json: true
  }).catch(err => {
    console.log('err', err);
    console.error(`${chalk.red(err && err.message ? err.message : 'request course info error, please check your cookie.')}`)
  });

  // 2. create download folder
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // TODO: encoded invalid char in  title
  const courseTitle = data.title.replace(/\//g, '-');
  if (!fs.existsSync(`${outputDir}/${courseTitle}`)) {
    fs.mkdirSync(`${outputDir}/${courseTitle}`);
  }

  const courseItems = data._embedded.units._embedded.units[0]._embedded.sessions._embedded.sessions;
  console.log(chalk.green(`start downloading course ${courseTitle}`));

  // 3. fetch download url
  courseItems.forEach(async (item, idx) => {
    const itemId = item.video_hashed_id.split(':')[1];
    const data = await request({
      uri: `https://edge.api.brightcove.com/playback/v1/accounts/3695997568001/videos/${itemId}`,
      headers: {
        'Accept': 'application/json;pk=BCpkADawqM2OOcM6njnM7hf9EaK6lIFlqiXB0iWjqGWUQjU7R8965xUvIQNqdQbnDTLz0IAO7E6Ir2rIbXJtFdzrGtitoee0n1XXRliD-RH9A-svuvNW9qgo3Bh34HEZjXjG4Nml4iyz3KqF',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
        'Origin': 'https://www.skillshare.com',
      },
      json: true
    });

    // 4. downloading course
    const downloadUrl = (data.sources.find(it => it.src) || {}).src;
    if (!downloadUrl) {
      console.log(chalk.red(`Cannot find download url for ${item.title} in ${courseTitle}`));
      return false;
    } else {
      const itemName = `${outputDir}/${courseTitle}/${idx + 1}-${item.title}.mp4`;
      // TODO 是否要判断已经存在该文件且重写？
      const writer = fs.createWriteStream(itemName);
      request.get(downloadUrl)
      // request.get('http://f1.media.brightcove.com/12/3695997568001/3695997568001_4856459137001_4856221816001.mp4?pubId=3695997568001&videoId=4856221816001')
        .on('response', (res) => {
          const barLine = console.draft(`Downloading ${idx + 1}-${item.title}-${courseTitle}`);
          function ProgressBar(progress) {
            const units = Math.round(progress / 2);
            return `${chalk.cyan(`Downloading ${idx + 1}-${item.title}-${courseTitle}: [${'='.repeat(units)}${' '.repeat(50 - units)}] ${progress}%`)})`;
          }

          const total = res.headers['content-length'];
          let arrived = 0;
          res.on('data', (chunk) => {
            arrived += chunk.length;
            barLine(ProgressBar((arrived / total * 100).toFixed(2)));
          })
        })
        .on('error', (err) => console.error(err))
        .on('end', () => console.log(`Successfully donwloaded course ${item.title}-${courseTitle}`))
        .pipe(writer);
    }
  })
}

async function downloader(anwsers) {
  let { cookie = '', courses, output: outputDir } = anwsers;
  outputDir = path.resolve(outputDir);
  // get cookie
  if (cookie) {
    Utils.saveCookie(cookie);
    console.log(chalk.green(`Saved cookie successfully!`));
  }

  config.cookie = Utils.readCookie();
  config.outputDir = outputDir;

  const courseIds = courses.split(',');
  courseIds.forEach(downloadCourseById);
}

module.exports = downloader;
