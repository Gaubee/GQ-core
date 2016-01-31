var util = require("util");
var events = require("events");
require("./$.Object");
require("./$.Function");
// require("./iClass");
// events.funToEventEmitter = function(con_fun) {
// 	return function() {
// 		Function.isFunction(con_fun) && con_fun.apply(this, arguments);
// 		events._initObjToEventEmitter(this);
// 	}
// };
events._initObjToEventEmitter = function(obj) {
	//不可被JSON化
	var _temp_obj = {};
	events.EventEmitter.call(_temp_obj);
	obj.setUnEnum("domain", _temp_obj.domain);
	obj.setUnEnum("_events", _temp_obj._events);
	obj.setUnEnum("_maxListeners", _temp_obj._maxListeners);
	return obj;
};
events.objToEventEmitter = function(obj) {
	//不可被JSON化
	obj = events._initObjToEventEmitter(obj);
	obj.__proto__ = events.EventEmitter.prototype;
	return obj;
};

global.events = events;

/*test*/
// ee = iClass.get("EventEmitter")();
// console.log(ee);
// ee.on("haha",function () {
// 	console.log("hahahaha");
// });
// ee.emit("haha")
// console.log(JSON.stringify(ee));
/*test2*/
// var HH = iClass.set("HH", "EventEmitter", function(name) {
// 	this.name = name;
// 	HH.super(this);
// });
// me = HH("Gaubee");
// for (var i = 0; i < 35; i++) {;
// 	(function(i) {
// 		me.on("say", function() {
// 			console.log(i, "I'm", this.name);
// 		});
// 	}(i));
// };
// me.emit("say");