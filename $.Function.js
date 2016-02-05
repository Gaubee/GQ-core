require("./$.String");
Function.noop = function() {};
Function.Permission = function(matchFun, succFun, errFun) {
	//字符串模式
	if (typeof matchFun === "string") {
		var matchStr = matchFun;
		matchFun = Function("return " + matchStr);
	} else if (typeof matchFun !== "function") {
		throw new TypeError("Permission Argument Must Be String Or Function");
	}

	succFun || (succFun = Function.noop);

	if (typeof errFun === "string") {
		var errStr = errFun;
		errFun = function() {
			throw new Error(errStr);
		}
	} else if (typeof errFun !== "function") {
		errFun = Function.noop;
	}

	return function() {
		var args = Array.prototype.slice.call(arguments);
		if (matchFun.apply(this, args)) {
			return succFun.apply(this, args);
		} else {
			return errFun.apply(this, args);
		}
	}
};
Function.prototype.perm = Function.prototype.permission = function(matchFun, errFun) {
	return Function.Permission(matchFun, this, errFun);
};
Function.isFunction = function(foo) {
	return typeof foo === "function";
};
var GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;

Function.isGeneratorFunction = function(foo) {
	return typeof foo === "function" && foo.constructor === GeneratorFunction;
};

Function.isClass = function(foo) {
	return Function.isFunction(foo) && foo.toString().indexOf("class") === 0;
};

Function.prototype.asComProto = function() {
	this.__as_com_proto__ = true;
	return this;
};
Function.prototype.noAsComProto = function() {
	this.__no_as_com_proto__ = true;
	return this;
};
var COMMENTS = /\/\/(.*$)|\/\*([\s\S]*?)\*\//mg;

Function.getParameterNames = function(fn, comment_replacer) {
	if (Function.isFunction(comment_replacer)) {
		var replacer_res = [];
		var code = fn.toString().replace(COMMENTS, function(match_str, p1, p2, offset, string) {
			replacer_res.push(comment_replacer(p1 || p2));
			return ""
		});
	} else {
		var code = fn.toString().replace(COMMENTS, "");
	}
	var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
		.match(/([^\s,]+)/g);

	return result === null ? [] : result;
};
Function.prototype.getParameterNames = function(comment_replacer) {
	return Function.getParameterNames(this, comment_replacer);
};

// function z /*A)QA*/ (a /*zz)*/ , b //B~B)
// )/*zzzz*/ /*zzzz32*/{}

// console.log(z.getParameterNames(function(comment) {
// 	console.log(comment)
// 	return comment
// }))
// console.log(z.toString())