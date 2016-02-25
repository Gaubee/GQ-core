require("./$.Function");
require("./$.Array");

var _co = require("co");
global.co = function co_pro(gen) {
	if (arguments.length > 1) {
		var args = Array.slice(arguments);
		if (Function.isFunction(args[args.length - 1])) {
			var catch_fun = args.pop();
		}
		var res = _co.apply(this, args);
		if (Function.isFunction(catch_fun)) {
			res = res.catch(catch_fun);
		}
	} else {
		res = _co(gen);
	}
	return res
};
co.wrap = function(fn, catch_fun) {
	createPromise.__generatorFunction__ = fn;
	return createPromise;

	function createPromise() {
		return co(fn.apply(this, arguments), err => {
			const args = Array.slice(arguments);
			args.unshift(err);
			catch_fun.apply(this, args);
		});
	}
};


var Tools = require("./Tools");
Tools.sleep = function(time) {
	return new Promise(function(resolve) {
		setTimeout(resolve, time)
	});
};
/*
co(function() {
	console.log(1);
	// yield Tools.sleep(1000);
	throw "QAQ"
	console.log(2)
}, err => {
	console.log("err:", err);
	z('zzz');
});

var z = co.wrap(function*(zz) {
	console.log(1, zz)
	yield Tools.sleep(1000);
	throw "QAQ"
	console.log(2)
}, err => {
	console.log("err:", err)
})*/