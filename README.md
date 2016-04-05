
# xpcshell-unit-test

A basic xpcshell test runner that can be used outside of Firefox (but
still requires a local Firefox build).

```js
npm install xpcshell-unit-test
```

## Usage

You need to pass paths to both a Firefox source directory and a built directory. For example:

```
xpcshell-test \
  --firefox-obj-dir ../gecko-dev/obj-x86_64-apple-darwin15.3.0 \
  --firefox-src-dir ../gecko-dev \
  <file-or-directory>...
```

It is recommended to automate this by creating a shell alias or an npm script.

You may pass one or more files or directories to run. If a single file
is passed, each assertion will be displayed, otherwise only each
filename that is run is displayed. A summary of failures will be
displayed at the end.

Example output:

```
TESTING tests/foo-1.js
[PASS] [run_test : 3] 1 == 1
[PASS] [run_test : 4] 2 == 2 
[PASS] [run_test : 13] 3 == 3
PASSED!
```

Each test will stop on the first error:

```
TESTING tests/foo-1.js
[PASS] [run_test : 3] 1 == 1
[FAIL] [run_test : 4] 2 == 1
1 FAILURES:
tests/foo-1.js: [run_test : 4] 2 == 1
```

