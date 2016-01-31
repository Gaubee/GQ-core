require("./Console");
Error.stackTraceLimit = 20;

var util = require("util");
var error_map = {
	"eval": EvalError,
	"range": RangeError,
	"reference": ReferenceError,
	"syntax": SyntaxError,
	"type": TypeError,
	"uri": URIError,
};

function Throw(type, error_str) {
	if (!util.isError(type)) {
		var err_con = error_map[type] || Error;
		var err = new err_con(error_str || type);
		var stack_arr = err.stack.split("\n");
		stack_arr.splice(0, 2);
		err.stack = stack_arr.join("\n");
		throw err
	} else {
		throw type;
	}
};

global.Throw = global.ThrowError = Throw;