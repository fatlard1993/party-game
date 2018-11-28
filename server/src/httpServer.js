const Fs = require('fs');
const Path = require('path');

const Polka = require('polka');
const StaticServer = require('serve-static');
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');

const { SocketServer, Game, User, Log, Cjs } = require('byod-game-engine');

const PublicDir = Path.join(__dirname, '../../client/src/');

const HomePath = '/home';

const App = Polka({
	onError: function(err, req, res, next){
		if(!err || !err.code){
			if(err instanceof Object) err.code = 500;

			else err = { err: err, code: 500 };
		}

		var detail;

		try{
			detail = err.detail || JSON.stringify(err, null, '  ');
		}

		catch(e){
			detail = 'Unknown error!';
		}

		var titles = {
			'401': '401 - Unauthorized',
			'403': '403 - Forbidden',
			'404': '404 - Not Found',
			'500': '500 - Internal Server Error'
		};

		Log.error()(`${req.originalUrl} | ${titles[err.code]}`);
		Log.error(1)(err);

		if(err.redirectPath){
			Log()(`Redirecting to: ${err.redirectPath}`);

			return res.redirect(307, err.redirectPath);
		}

		var file = Fs.readFileSync(Path.join(__dirname, '../../client/src/html', 'error.html'), 'utf8');

		if(!file){
			Log.error()('Unable to read error html file');

			return res.status(500).end('ERROR');
		}

		file = file.replace(/XXX/g, titles[err.code] || err.code);
		file = file.replace(/YYY/g, detail);

		res.status(err.code).end(file);
	}
});

App.use(function(req, res, next){
	Log()(`\nReq Url - ${req.originalUrl}`);

	res.sendFile = function(path){
		Log()(`Send file - ${path}`);

		Fs.readFile(path, function(err, file){
			res.end(file);
		});
	};

	res.json = function(json){
		Log()('Send JSON - ', json);

		res.writeHead(200, { 'Content-Type': 'application/json' });

		res.end(JSON.stringify(json));
	};

	res.redirect = function(code, path){
		Log()(`${code} redirect - ${path}`);

		res.writeHead(code, { 'Location': path });

		res.end();
	};

	res.send = function(string){
		Log()(`Send string - "${string}"`);

		res.end(string);
	};

	res.status = function(code){
		res.statusCode = code;

		return res;
	};

	next();
});

App.use(function redirectTrailingWak(req, res, next){
	var splitReqUrl = req.originalUrl.split('?');
	var path = splitReqUrl[0];

	if(path.slice(-1) !== '/') return next();
	path = path.slice(0, -1);

	var query = splitReqUrl[1];

	res.redirect(301, path ? (path + (query ? ('?'+ query) : '')) : HomePath);
});

App.use(BodyParser.json());

App.use(BodyParser.urlencoded({ extended: false }));

App.use(CookieParser());

App.get('/testj', function(req, res){
	Log()('Testing JSON...');

	res.json({ test: 1 });
});

App.get('/test', function(req, res){
	Log()('Testing...');

	res.send('{ test: 1 }');
});

App.use(StaticServer(PublicDir));

App.get('/home', function(req, res){
	res.sendFile(Path.join(PublicDir, 'html/index.html'));
});

App.get('/game/:gameName', function(req, res, next){
	if(!{ tweak: 1, mindMaze: 1 }[req.params.gameName]) return next({ code: 404 });

	res.sendFile(Path.join(PublicDir, `html/${req.params.gameName}.html`));
});

module.exports = {
	init: function(port){
		App.listen(port);

		return App.server;
	}
};