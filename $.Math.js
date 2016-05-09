Math.range = function(min, value, max) {
	if (min > max) {
		throw "Max value mush large than Min value"
	}
	return Math.min(Math.max(min, value), max);
};
Math.randomWithRange = function(min, max) {
	var args_len = arguments.length;
	var ran = Math.random();
	if (args_len === 0) {
		return ran;
	}
	if (args_len === 1) {
		return ran * min
	}
	if (args_len > 1) {
		return ran * (max - min) + min
	}
};

// console.log(Math.range(0,-0.3,1))