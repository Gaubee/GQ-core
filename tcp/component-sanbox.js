"use strict";
const vm = require("vm");


// 组件运行的沙盒代码
class ComponentSandboxFactory {
	constructor() {
		this.sandboxsMap = new Map();
	}
	buildComponentSandbox(com, type, args, safe_task_id) {

		/*
		 * 根据不同的组件类型生成不同构造代码
		 */
		if (type === "class") {
			if (!Array.isArray(args)) {
				Throw("type", "Class Component's args mush be Array");
			};
			var code = `
			function ComponentContructor(com, args) {
				return new com(${args.map((arg,index)=>"args["+index+"]") });
			};`
		} else if (type === "function") {
			if (!Array.isArray(args)) {
				Throw("type", "Function Component's args mush be Array");
			};
			var code = `
			function ComponentContructor(com, args) {
				return com(${args.map((arg,index)=>"args["+index+"]") });
			};`
		} else if (type === "object") {
			var code = `
			function ComponentContructor(com, args) {
				args.__proto__ = com;
				return args;
			};`
		}

		// 沙盒的上下文
		var sandbox = {
			type: type,
			com: com,
			args: args
		}
		vm.createContext(sandbox);

		code += `
		var com_instance = ComponentContructor(com, args);
		`

		vm.runInContext(code, sandbox);
		this.sandboxsMap.set(safe_task_id, sandbox);
		return sandbox;
	}
	has(safe_task_id) {
		return this.sandboxsMap.has(safe_task_id);
	}
	get(safe_task_id) {
		return this.sandboxsMap.get(safe_task_id);
	}
	delete(safe_task_id) {
		return this.sandboxsMap.delete(safe_task_id);
	}
};

exports.ComponentSandboxFactory = ComponentSandboxFactory;

var componentSandboxOrders = exports.componentSandboxOrders = Object.create(null);
componentSandboxOrders["run-method"] = {
	types: ["class", "function", "object"],
	handle: function(sandbox, data) {
		var name = data.name;
		var args = data.args;
		if (!String.isString(name)) {
			Throw("type", "name must be String");
		}
		if (!Array.isArray(args)) {
			Throw("type", "args must be Array");
		}

		var com_instance = sandbox.com_instance;

		var res = com_instance[name].apply(com_instance, args);
		if (!(res instanceof Promise)) {
			res = Promise.resolve(res);
		}
		return res
	}
};
componentSandboxOrders["set-property"] = {
	types: ["class", "function", "object"],
	handle: function(sandbox, data) {
		var key = data.key;
		var value = data.value;
		if (!String.isString(key)) {
			Throw("type", "key must be String");
		}

		var com_instance = sandbox.com_instance;

		var res = com_instance[key] = value;
		if (!(res instanceof Promise)) {
			res = Promise.resolve(res);
		}
		return res;
	}
};
componentSandboxOrders["get-property"] = {
	types: ["class", "function", "object"],
	handle: function(sandbox, key) {
		if (!String.isString(key)) {
			Throw("type", "key must be String");
		}

		var com_instance = sandbox.com_instance;

		var res = com_instance[key];
		if (!(res instanceof Promise)) {
			res = Promise.resolve(res);
		}
		return res;
	}
};
componentSandboxOrders["multi-order"] = {
	types: ["class", "function", "object"],
	handle: function(sandbox, orders) {
		return orders.filterMap(function(order) {
			if (!order) {
				return
			}
			const order_handle = componentSandboxOrders[order.type];
			if (!order_handle) {
				return
			}
			if (order_handle.types.indexOf(sandbox.type) === -1) {
				return
			}
			return order_handle.handle(sandbox, order.data);
		})
	}
};

/*TEST*/
// var componentSandboxFactory = new ComponentSandboxFactory;
// var sandbox = componentSandboxFactory.buildComponentSandbox({
// 	say: function() {
// 		return this.word;
// 	}
// }, "object", {
// 	word: "QAQ"
// });

// console.log(sandbox.com_instance.say())

// var sandbox = componentSandboxFactory.buildComponentSandbox(class QAQ {
// 	constructor(name, word) {
// 		this.name = name;
// 		this.word = word;
// 	}
// 	say() {
// 		return this.name + ":" + this.word;
// 	}
// }, "class", ["Gaubee", "QAQ"]);

// console.log(sandbox.com_instance.say())