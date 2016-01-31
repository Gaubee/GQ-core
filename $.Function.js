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