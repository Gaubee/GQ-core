global.co = require("co");
var Tools = require("./Tools");
Tools.sleep = function(time) {
	return new Promise(function(reslove) {
		setTimeout(reslove, time)
	});
}