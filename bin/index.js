#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const downloader = require('../src/downloader');

program
  .version(require('../package').version)
  .usage('<command> [options]');

// 直接敲命令就可以下载
program
  .description('download videos from skillshare')
  .option('-d --dir <path>', 'set video downloading folder')
  .action(() => {
    // 1. 输入cookie
    inquirer.prompt([
      {
        name: 'cookie',
        message: 'Input your skillshare cookie:',
        validate(input) {
          return input !== '' ? true : 'Please input your cookie';
        }
      },
      {
        name: 'courses',
        message: `Input course ids(${chalk.magenta('split your courses ids by ,')})`,
        validate(input) {
          return input !== '' ? true : 'Please input course id';
        }
      }
    ]).then(answers => {
      downloader(answers);
    })
    // 2. 输入课程链接
    // 3. 下载
  });

// required, to pass terminal arguments
program.parse(process.argv);
