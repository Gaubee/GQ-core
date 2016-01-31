require("./$.Date");
require("./$.Array");
require("./$.Object");
require("./$.String");
var util = require("util")

function Console() {
	this.before = [];
	this.date_format = "hh:mm:ss MM-DD";
	this.timeMap = {};
	for (var i in this) {
		if (typeof this[i] === "function") {
			this[i] = this[i].bind(this);
		}
	}
};
var _console = global.console;
global.nactive_console = _console;
Console.prototype = {
	addBefore: function(arr) {
		arr = Array.slice(arr);
		var strs = util.format.apply(this, arr);
		var before_str = this.before.join(" ")
		strs = before_str + strs.replace(/\n/g, '\n' + before_str);
		return [strs];
	},
	log: function() {
		var args = this.addBefore(arguments);
		_console.log.apply(_console, args);
	},
	info: function() {
		var args = this.addBefore(arguments);
		_console.info.apply(_console, args);
	},
	debug: function() {
		var args = this.addBefore(arguments);
		_console.debug.apply(_console, args);
	},
	warn: function() {
		var args = this.addBefore(arguments);
		_console.warn.apply(_console, args);
	},
	error: function() {
		var args = this.addBefore(arguments);
		_console.error.apply(_console, args);
	},
	assert: _console.assert,
	trace: _console.trace,
	dir: function(object, options) {
		var args = this.addBefore([util.inspect(object, util._extend({
			customInspect: false
		}, options)) + "\n"]);
		_console.log.apply(_console, args);
	},
	time: function() {
		var start_date = new Date;
		var time_str = Array.slice(arguments).join(" ");
		this.timeMap[time_str] = start_date;

		this.before.push("┌ (" + start_date.format(this.date_format) + ")");
		var args = this.addBefore(arguments);
		_console.log.apply(_console, args);

		this.before.pop();
		this.before.push("│ ");
	},
	timeEnd: function() {
		var end_date = new Date;
		var time_str = Array.slice(arguments).join(" ");
		if (!this.timeMap.$hasPro(time_str)) {
			throw new Error("No such label: " + time_str);
		}
		var start_date = this.timeMap[time_str];

		this.before.pop();
		this.before.push("└ (" + end_date.format(this.date_format) + ")");
		var args = this.addBefore(arguments);
		args.push(": " + (end_date - start_date) + "ms");
		_console.log.apply(_console, args);
		this.before.pop();
	},
	group: function() {
		this.before.push("┌ ");
		var args = this.addBefore(arguments);
		_console.log.apply(_console, args);

		this.before.pop();
		this.before.push("│ ");
	},
	groupEnd: function() {
		this.before.pop();
		this.before.push("└ ");
		var args = this.addBefore(arguments);
		_console.log.apply(_console, args);
		this.before.pop();
	},
	flag: function(flag) {
		var arr = Array.slice(arguments);
		arr[0] = ("[" + flag + "]").colorsHead()
		this.log.apply(this, arr);
	},
	flagHead: function(flag) {
		return ("[" + flag + "]").colorsHead();
	}
};
Console.prototype.__proto__ == _console;

delete global.console
global.console = global.con = new Console;

/*TEST*/
// con = new Console;
// con.time("aaa", 1);
// con.time("aaa", 2);
// con.log("hahha");
// con.timeEnd("aaa", 2);
// con.timeEnd("aaa", 1);

// con.group("xx")
// con.log({
// 	a: "a",
// 	b: "QAQ",
// 	ssssssssssssssssssssssssssssss: [1, 2, 3, 3, , 4, , , 5, , , 6, ],
// });
// con.log("hahha1");
// con.group("xx")
// con.log("hahha2");
// con.group("xx")
// con.log("hahha3");
// con.groupEnd("haha1")
// con.log("hahha4");
// con.groupEnd("haha2")
// con.log("hahha5");
// con.error(new Error("asd").stack);
// con.groupEnd("haha3")