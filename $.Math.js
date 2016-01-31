Math.range = function(min, value, max) {
	if (min > max) {
		throw "Max value mush large than Min value"
	}
	return Math.min(Math.max(min, value), max);
};

// console.log(Math.range(0,-0.3,1))