require("./$.Function");
require("./$.Array");

const _co = require("co");
const _co_wrap = _co.wrap;
global.co = function co_pro(gen) {
	if (arguments.length > 1) {
		var args = Array.slice(arguments);
		if (Function.isFunction(args[args.length - 1])) {
			var catch_fun = args.pop();
		}
		var res = _co.apply(this, args);
		res = res.catch(catch_fun);// 非Function会自己穿透
	} else {
		res = _co(gen);
	}
	return res
};
co.wrap = function(fn, catch_fun) {
	createPromise.__generatorFunction__ = fn;
	if (Function.isFunction(catch_fun)) {
		return createPromise;
	} else {
		return _co_wrap(fn);
	}

	function createPromise() {
		return co.call(this, fn.apply(this, arguments), err => {
			const args = Array.slice(arguments);
			args.unshift(err);
			return catch_fun.apply(this, args);
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