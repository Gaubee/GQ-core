var http = require("http");
require("./$.co");
var Tools = require("./Tools");
Tools.curl = function(url) {
	return new Promise(function(reslove, reject) {
		http.get(url, (res) => {
			var bufs = [];
			res.on("data", function(chunk) {
				bufs.push(chunk)
			});
			res.on("end", function() {
				reslove(Buffer.concat(bufs).toString());
			});
		}).on('error', reject);
	});
};
