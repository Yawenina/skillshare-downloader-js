// TODO: catch (https) errors
// TODO: escape title
// TODO: skip exist course
// TODO: user can define where to save
// TODO: trim user inputs and ids

const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const Utils = require('./utils');

const config = {
  cookie: '',
  outputDir: ''
}

async function downloadCourseById(courseId) {
  const { cookie, outputDir } = config;
  // 1. request for course info
  const res = await axios.get(`https://api.skillshare.com/classes/${courseId}`, {
    headers: {
      'Accept': 'application/vnd.skillshare.class+json;,version=0.8',
      'User-Agent': 'Skillshare/4.1.1; Android 5.1.1',
      'Host': 'api.skillshare.com',
      cookie
    }
  }).catch(err => {
    console.log('err', err);
    console.error(`${chalk.red(err && err.message ? err.message : 'request course info error, please check your cookie.')}`)
  });

  const { data = {} } = res;
  // 2. create download folder
  const courseTitle = data.title;
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  } catch {

  }

  // TODO: escape title what if it has a '/' in title
  if (!fs.existsSync(`${outputDir}/${courseTitle}`)) {
    fs.mkdirSync(`${outputDir}/${courseTitle}`);
  } else {
    console.log(chalk.red(`You have already had [${courseTitle}] under ${outputDir}.`));
    return;
  }
  const courses = data._embedded.units._embedded.units[0]._embedded.sessions._embedded.sessions;
  console.log(chalk.green(`Start downloading course ${chalk.cyan(courseTitle)} under ${outputDir}...`));

  // 3. fetch download url
  courses.forEach(async (course, idx) => {
    const courseId = course.video_hashed_id.split(':')[1];
    const data = await axios.get(`https://edge.api.brightcove.com/playback/v1/accounts/3695997568001/videos/${courseId}`, {
      headers: {
        'Accept': 'application/json;pk=BCpkADawqM2OOcM6njnM7hf9EaK6lIFlqiXB0iWjqGWUQjU7R8965xUvIQNqdQbnDTLz0IAO7E6Ir2rIbXJtFdzrGtitoee0n1XXRliD-RH9A-svuvNW9qgo3Bh34HEZjXjG4Nml4iyz3KqF',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
        'Origin': 'https://www.skillshare.com',
      }
    });

    // 4. downloading course
    const downloadUrl = (data.sources.find(it => it.src) || {}).src;
    if (!downloadUrl) {
      console.log(chalk.red(`Cannot find download url for ${course.title} in ${courseTitle}`));
      return;
    } else {
      const writer = fs.createWriteStream(`${outputDir}/${courseTitle}/${idx + 1}-${course.title}.mp4`);
      console.log(chalk.green(`Start downloading course ${chalk.cyan(courseTitle)} ${chalk.cyan(course.title)}...`));
      const res = await axios(downloadUrl, {
        method: 'get',
        responseType: 'stream'
      });
      res.data.pipe(writer);
      writer.on('finish', () => console.log(chalk.yellow(`Successfully downloading course ${chalk.cyan(course.title)}`)));
      writer.on('error', () => console.log(chalk.yellow(`Failed downloading course ${chalk.cyan(course.title)}`)))
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
