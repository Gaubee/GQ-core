require("./$.Object");
Set.prototype.setUnEnum("map", function(cb) {
	"use strict";
	var res = [];
	var set_iterator = this.values();
	var val;
	while (!(val = set_iterator.next()).done) {
		// cb(value, index)
		res.push(cb.call(this, val.value, res.length));
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