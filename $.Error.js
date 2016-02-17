var colors = require("colors");
require("./Console");
require("./$.String");
Error.stackTraceLimit = 20;

var util = require("util");
var error_map = {
	"*": Error,
	"eval": EvalError,
	"range": RangeError,
	"reference": ReferenceError,
	"ref": ReferenceError,
	"syntax": SyntaxError,
	"type": TypeError,
	"uri": URIError,
};

function Throw(type, error_str) {
	if (!util.isError(type)) {
		var err_con = error_map[type] || Error;
		var err = new err_con(error_str || type);
		var stack_arr = err.stack.split("\n");
		stack_arr.splice(1, 1);
		err.stack = stack_arr.join("\n");
		throw err
	} else {
		throw type;
	}
};

global.Throw = global.ThrowError = Throw;


String.prototype.setUnEnum("$toError", function(type) {
	var err_con = error_map[type] || Error;
	var err = new err_con(error_str || type);
	var stack_arr = err.stack.split("\n");
	stack_arr.splice(0, 2);
	err.stack = stack_arr.join("\n");
	return err;
});

Error.isError = function(err) {
	return util.isError(err);
};

Object.keys(error_map).forEach(function(key) {
	if (!error_map[key].prototype.toJSON) {
		error_map[key].prototype.setUnEnum("toJSON", function() {
			return this.message
		});
	}
	if (!error_map[key].prototype.inspect) {
		error_map[key].prototype.setUnEnum("inspect", function() {
			var err_str = (this.stack || this.message || "");

			err_str = err_str.split("\n");
			var msg = colors.bold(colors.red(err_str.shift()));
			for (var i = 0, len = err_str.length; i < len; i += 1) {
				err_str[i] = colors.bgRed(colors.green(err_str[i]))
			}
			err_str = msg + colors.bgRed("\n" + err_str.join("\n"))

			return err_str;
		});
	}
});