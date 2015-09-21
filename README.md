# Coopboard

Coopboard is an interactiv Mindmap-tool build with Node.js and a lot of love build in.

### DEMO
[Official Demo](http://coopboard.net/)

### Testet on:

Ubuntu 15.04 with Node  v4.0.0

### Installation

You need Node installed on your system, check with:
```sh 
$ node -v
```
Than you can do the following:
```sh
$ git clone https://github.com/CoopBoard/coopboard coopboard
$ cd coopboard
$ git submodule init
$ git submodule update
$ npm install
```
In addition you need to initialize the datebase at first time:
```sh
$ node init_db.js
```
To run the aktual server:
```sh
$ node server.js
```
To update the  server:
```sh
$ git pull
$ git submodule init
$ git submodule update
```
