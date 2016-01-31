var Tools = require("./Tools");
Tools.runGEN = function runGEN(generatorFunction) {
	var generatorItr = generatorFunction(resume);
	var _is_running;

	function resume(callbackValue) {
		if (_is_running) {
			process.nextTick(resume); // 放到异步队列中，让caller把函数全部执行完，去执行_is_running = false
		} else {
			_is_running = true;
			generatorItr.next(callbackValue);
			_is_running = false;
		}
	}
	_is_running = true;
	generatorItr.next();
	_is_running = false;
};