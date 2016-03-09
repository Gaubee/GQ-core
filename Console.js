require("./$.Date");
require("./$.Array");
require("./$.Object");
require("./$.String");
const util = require("util");
const colors = require("colors");
const color_flag_reg = /(\u001b\[\d+m)([\s\S]+?)(\u001b\[\d+m)/; //不以^开头，前面可能有空格

function Console() {
	this.before = [];
	this.beforeSymbol = [];
	this.date_format = "hh:mm:ss MM-DD";
	this.timeMap = {};
	for (var i in this) {
		if (typeof this[i] === "function") {
			this[i] = this[i].bind(this);
		}
	}
};
const _console = global.console;

global.nactive_console = _console;
global.Console = Console;

Console.replaceColorContent = function(str, replacer) {
	if (color_flag_reg.test(str)) {
		var replacer_color_info = replacer.match(color_flag_reg);
		if (replacer_color_info) {
			replacer = replacer_color_info[2]
		}
		return str.replace(color_flag_reg, "$1" + replacer.replaceAll("$", "$$$$") + "$3")
	}
	return replacer;
};
// Color Symbol
const COLOR_ENUM = Console.COLOR = {};
const COLOR_MAP = new Map();
Object.keys(colors.styles).filter(key => {
	var sym = COLOR_ENUM[key] = Symbol(key);
	COLOR_MAP.set(sym, colors.styles[key])
});

Console.prototype = {
	addBefore: function(arr) {
		arr = Array.slice(arr);
		var strs = util.format.apply(this, arr);
		var before_str = this.before.join("")
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
	group: function(may_be_flag) {
		var color_start = "";
		var color_end = "";
		if (util.isSymbol(may_be_flag) && COLOR_MAP.has(may_be_flag)) {
			var style = COLOR_MAP.get(may_be_flag);
			color_start = style.open;
			color_end = style.close;
			arguments = Array.slice(arguments, 1);
		} else if (String.isString(may_be_flag)) {
			var color_wrap = may_be_flag.match(color_flag_reg);
			if (color_wrap) {
				color_start = color_wrap[1];
				color_end = color_wrap[3];
			}
		}
		this.before.push(color_start + "┌ " + color_end);
		var log_lines = util.format.apply(this, arguments).split("\n");
		var args = this.addBefore([log_lines.shift()]);
		_console.log.apply(_console, args);

		this.before.pop();
		this.before.push(color_start + "│ " + color_end);

		while (log_lines.length) {
			this.log(log_lines.shift());
		}

		var res_symbol = Symbol(this.beforeSymbol.length);
		this.beforeSymbol.push(res_symbol);
		return res_symbol;
	},
	groupEnd: function(may_be_symbol) {
		/* 交错模式 */
		if (util.isSymbol(may_be_symbol)) {
			const start_index = this.beforeSymbol.lastIndexOf(may_be_symbol)
			const before_len = this.beforeSymbol.length;
			if (start_index !== -1 && start_index !== before_len - 1) {

				/* Match color */
				var group_flag = this.before[start_index];

				var backup = [];
				for (var i = start_index + 1; i < before_len; i += 1) {
					backup.push(this.before[i]);
					this.before[i] = Console.replaceColorContent(group_flag, this.before[i].replace(/(\s*)│(\s*)/, function(s, before_emp_s, after_emp_s) {
						return "─".repeat(before_emp_s.length) + "┼" + ((i === before_len - 1) ? after_emp_s : "─".repeat(after_emp_s.length))
					}));
				}
				this.before[start_index] = group_flag.replace("│ ", "└─");

				var args = this.addBefore(Array.slice(arguments, 1));
				_console.log.apply(_console, args);

				for (i -= 1; i > start_index; i -= 1) {
					this.before[i] = backup.pop();
				}

				this.before.splice(start_index, 1);
				this.before[i] = "  " + this.before[i];
				this.beforeSymbol.splice(start_index, 1);
				return
			} else {
				arguments = Array.slice(arguments, 1);
			}
		}
		/* 简单模式 */
		var group_flag = this.before[this.before.length - 1];
		this.before[this.before.length - 1] = group_flag.replace("│", "└");

		var log_lines = util.format.apply(this, arguments).split("\n");
		var args = this.addBefore([log_lines.shift()]);
		_console.log.apply(_console, args);
		this.before.pop();

		while (log_lines.length) {
			this.log(log_lines.shift());
		}

		this.beforeSymbol.pop();
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


// con = new Console;
// var _3 = con.group("0".red)
// var _0 = con.group("0".green)
// var _1 = con.group("1".blue)
// var _2 = con.group("2");
// con.log({
// 	test: "zzz",
// 	zzz: {
// 		cc: [1, 2, 3, 4, 5, 6],
// 		dd: [1, 2, 3, 4, 5, 6],
// 	},
// 	f: () => {}
// })
// con.groupEnd(_1, "1")
// con.groupEnd(_3, "0")
// con.groupEnd(_2, "2")
// con.groupEnd("0")