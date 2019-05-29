#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const downloader = require('../src/downloader');
const Utils = require('../src/utils');

program
  .version(require('../package').version)
  .usage('<command> [options]');

// 直接敲命令就可以下载
program
  .description('download videos from skillshare')
  .option('-d --dir <path>', 'set video downloading folder')
  .action(() => {
    const questions = [];
    if (!Utils.hasCookie()) {
      questions.push({
        name: 'cookie',
        message: 'Input your skillshare cookie:',
        validate(input) {
          return input !== '' ? true : 'Please input your cookie';
        }
      })
    }

    questions.push({
      name: 'courses',
      message: `Input course ids(${chalk.magenta('split your courses ids by ,')})`,
      validate(input) {
        return input !== '' ? true : 'Please input course id';
      }
    });
    inquirer.prompt(questions).then(answers => {
      downloader(answers);
    })
  });

// required, to pass terminal arguments
program.parse(process.argv);
