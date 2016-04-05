#!/usr/bin/env node
"use strict";

const join = require('path').join;
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const chalk = require('chalk');
const spawnSync = require('child_process').spawnSync;

const args = minimist(process.argv.slice(2));
const paths = args['_'];

if(!args["firefox-obj-dir"]) {
  console.log("You must pass --firefox-obj-dir to indicate where a Firefox build lives");
  process.exit(1);
}
if(!args["firefox-src-dir"]) {
  console.log("You must pass --firefox-src-dir to indicate where the source for Firefox lives");
  process.exit(1);
}

const objPath = path.resolve(args["firefox-obj-dir"]);
const srcPath = path.resolve(args["firefox-src-dir"]);

function runTest(filename, verbose) {
  console.log('TESTING ' + filename);

  // This stat also ensures that the file exits, as it will throw a
  // useful ENOENT error.
  if(!fs.statSync(filename).isFile()) {
    throw new Error(filename + " is not a file!");
  }

  const res = spawnSync(
    join(objPath, 'dist/bin/xpcshell'),
    ['-g', join(objPath, 'dist/Nightly.app/Contents/Resources'),
     '-a', join(objPath, 'dist/Nightly.app/Contents/Resources/browser'),
     '-m', '-s',
     '-e', 'const _TESTING_MODULES_DIR = "' + join(objPath, '_tests/modules') + '"',
     '-e', 'const _TEST_NAME = "' + filename + '"',
     '-e', 'const _TEST_FILE = ["' + path.resolve(filename) + '"]',
     '-e', 'const _HEAD_FILES = _TAIL_FILES = []',
     '-e', 'const _JSDEBUGGER_PORT = 0',
     '-f', join(srcPath, 'testing/xpcshell/head.js'),
     '-e', '_execute_test(); quit(0);'],
    { env: { 'DYLD_LIBRARY_PATH': join(objPath, 'dist/Nightly.app/Contents/MacOS') }}
  );

  const output = res.stdout.toString();
  let failure = null;
  output.split('\n').forEach(line => {
    line = line.trim();
    if (line !== '') {
      const result = JSON.parse(line);
      if (result.action === 'test_status') {
        const failed = result.status === 'FAIL';
        if (failed) {
          // The test runner stops on the first failure, so there's
          // only ever one.
          failure = result;
        }

        if (verbose || failed) {
          const status = (failed ?
                          chalk.red(result.status) :
                          chalk.green(result.status));
          console.log('[' + status + ']', result.message);
        }
      }
    }
  });

  return failure;
}

let failures = paths.reduce((acc, path) => {
  if(fs.statSync(path).isDirectory()) {
    const files = fs.readdirSync(path);
    return acc.concat.apply(acc, files.map(file => runTest(join(path, file))));
  }
  else {
    return acc.concat([runTest(path, paths.length === 1)]);
  }
}, []);

failures = failures.filter(x => x);

if(failures.length) {
  console.log(chalk.red(failures.length + ' FAILURES:'));
  failures.forEach(failure => {
    console.log(failure.test + ': ' + failure.message);
  });
}
else {
  console.log(chalk.green('PASSED!'));
}
