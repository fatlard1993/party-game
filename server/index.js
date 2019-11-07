#!/usr/bin/env node

const args = require('yargs').argv;

//log args polyfill
if(args.v || args.dbg) process.env.DBG = args.v || (args.dbg === true ? 1 : args.dbg);
if(args.dev || args.dbg) process.env.COLOR = 1;

const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec, execFile, spawn} = require('child_process');
const crypto = require('crypto');

const args = require('yargs').argv;
const log = require('log');
const util = require('js-util');
const fsExtended = require('fs-extended');
const fontManager = require('font-manager');
const controlNet = require('control-net');
const configParser = require('config-parser');
const Config = require('config-manager');

const rootFolder = require('find-root')(__dirname);

function rootPath(){ return path.join(rootFolder, ...arguments); }

log('[party-game] Starting...');

const config = new Config(rootPath('config.json'), {
	port: 80
});

const { app, pageCompiler } = require('http-server').init(args.port || system.config.current.port, rootFolder, '/lobby');

pageCompiler.buildFile('lobby');
pageCompiler.buildFile('error');

const sockets = new (require('./socketServer'))(app.server);

require('./router')(app, system);

log.info(`[party-game] IP ${system.ip_address}`);
log.info(`[party-game] Version ${system.hardwareInfo.version}`);