require("./$.Object");
Map.prototype.setUnEnum("map", function(cb) {
	"use strict";
	var res = [];
	var map_iterator = this.entries();
	var v_k;
	while (!(v_k = map_iterator.next()).done) {
		// cb(key, value)
		res.push(cb.call(this, v_k.value[0], v_k.value[1]));
	}
	return res;
});
/*
setTimeout(process.exit, 1000);
m = new Map();
m.set(1, "a")
m.set(2, "b")
m.set(3, "c")
var res = m.map((k, v) => {
	console.log;
	return k + "-" + v
});
console.log(res)*/