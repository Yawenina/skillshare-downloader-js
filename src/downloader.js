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

async function downloader(anwsers) {
  let { cookie = '', courses, output: outputDir } = anwsers;
  outputDir = path.resolve(outputDir);
  // get cookie
  if (cookie) {
    Utils.saveCookie(cookie);
    console.log(chalk.green(`Saved cookie successfully!`));
  } else {
    cookie = Utils.readCookie();
  }

  const ids = courses.split(',');
  // 1. request for course info
  ids.forEach( async (id) => {
    const data =await axios.get(`https://api.skillshare.com/classes/${id}`, {
      headers: {
        'Accept': 'application/vnd.skillshare.class+json;,version=0.8',
        'User-Agent': 'Skillshare/4.1.1; Android 5.1.1',
        'Host': 'api.skillshare.com',
        'cookie': cookie
      }
    });

    // 2. create download folder
    const projectTitle = data.data.title;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    // TODO: escape title what if it has a '/' in title
    if (!fs.existsSync(`${outputDir}/${projectTitle}`)) {
      fs.mkdirSync(`${outputDir}/${projectTitle}`);
    } else {
      console.log(chalk.red(`You have already had [${projectTitle}] under ${outputDir}.`));
      return;
    }
    const courses = data.data._embedded.units._embedded.units[0]._embedded.sessions._embedded.sessions;
    console.log(chalk.green(`Start downloading course ${chalk.cyan(projectTitle)} under ${outputDir}...`));

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
      const downloadUrl = (data.data.sources.find(it => it.src) || {}).src;
      if (!downloadUrl) {
        console.log(chalk.red(`Cannot find download url for ${course.title} in ${projectTitle}`));
        return;
      } else {
        const writer = fs.createWriteStream(`${outputDir}/${projectTitle}/${idx + 1}-${course.title}.mp4`);
        console.log(chalk.green(`Start downloading course ${chalk.cyan(projectTitle)} ${chalk.cyan(course.title)}...`));
        const res = await axios(downloadUrl, {
          method: 'get',
          responseType: 'stream'
        });
        res.data.pipe(writer);
        writer.on('finish', () => console.log(chalk.yellow(`Successfully downloading course ${chalk.cyan(course.title)}`)));
        writer.on('error', () => console.log(chalk.yellow(`Failed downloading course ${chalk.cyan(course.title)}`)))
      }
    })
  })

}
module.exports = downloader;
