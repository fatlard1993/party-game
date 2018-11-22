const fs = require('fs');
const path = require('path');

module.exports = {
	onRequest: function(req, res){
		fs.readFile(path.join(__dirname, '..', '..', 'client', 'src', 'index.html'), 'utf8', (err, result) => {
			if(err){
				res.status(500);
				res.end(err.message);

				return;
			}

			res.end(result);
		});
	}
};