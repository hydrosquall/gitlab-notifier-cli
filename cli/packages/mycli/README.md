mycli
=====



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mycli.svg)](https://npmjs.org/package/mycli)
[![Downloads/week](https://img.shields.io/npm/dw/mycli.svg)](https://npmjs.org/package/mycli)
[![License](https://img.shields.io/npm/l/mycli.svg)](https://github.com/sw-yx/mycli/blob/master/package.json)

<!-- toc -->
- [mycli](#mycli)
- [Usage](#usage)
- [Commands](#commands)
- [Local Dev](#local-dev)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g mycli
$ mycli COMMAND
running command...
$ mycli (-v|--version|version)
mycli/0.0.0 darwin-x64 node-v10.17.0
$ mycli --help [COMMAND]
USAGE
  $ mycli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->

# Local Dev


```
## example 1: global dep
## in CLI folder
yarn link --global
## in project folder
myfirstcli init

## example 2: local dep
## in CLI folder
yarn link
## in project folder
yarn link myfirstcli
yarn myfirstcli init
```
