const util = require("util");
// client 拓展 出Component指令
exports.handleClient = handleClient;

function handleClient(socket) {
	buildComponentDoc(socket);
	registerComponent(socket);
	initComponent(socket);
	orderComponent(socket);
};

/*
 * 组件文档生成器
 */
exports.buildComponentDoc = buildComponentDoc;

function buildComponentDoc(socket) {

	function formatItemDoc(proto) {
		if (String.isString(proto)) {
			return proto.$toDoc();
		} else if (Object.isObject(proto) && proto.name && String.isString(proto.name)) {
			return {
				name: String.asString(proto.name),
				type: String.asString(proto.type),
				des: String.asString(proto.des),
			}
		}
	};

	function getParamsDoc(fun, baseDoc) {
		var params = Array.isArray(baseDoc) ? baseDoc.filterMap(formatItemDoc) : [];
		params = params.toMap();

		var res = fun.getParameterNames().map(function(param_name) {
			return {
				name: param_name
			};
		});
		res = res.map(function(param_item) {
			return params.$hasPro(param_item.name) ? params[param_item.name] : param_item
		});
		return res;
	};
	socket.buildComponentDoc = function(doc, com) {
		if (!com) {
			com = doc;
			doc = {};
		};
		if (String.isString(doc)) {
			doc = {
				des: doc
			};
		} else if (Object.isObject(doc)) {
			doc = {
				des: doc.des,
				init_protos: doc.init_protos,
				methods: doc.methods,
				properties: doc.properties,
			}
		} else {
			Throw("type", "component-document name must be object or string.");
		}
		// 增加Methods描述
		var methods = Array.isArray(doc.methods) ? doc.methods.filterMap(formatItemDoc) : [];
		methods = methods.toMap("name");
		var method_obj;
		var prototype_obj;

		/*生成InitProtos-DOC*/
		var com_type;
		if (Function.isFunction(com)) {
			com_type = "function";
			doc.init_protos = getParamsDoc(com, doc.init_protos);

			if (Function.isClass(com)) {
				com_type = "class";
				method_obj = com.prototype;
			}
		} else if (Object.isObject(com)) {
			com_type = "object";
			method_obj = com;
			prototype_obj = com;
		}
		// components.set(com_name, com); // after success.

		var no_as_com_protos = Array.asArray(com.__no_as_com_proto_list__);

		/*分析源码，生成Methods-DOC*/
		while (method_obj && method_obj !== Object.prototype) {
			Object.getOwnPropertyNames(method_obj).forEach(function(proto_name) {
				if (proto_name === "constructor") {
					return
				}
				var method = method_obj[proto_name];
				if (!Function.isFunction(method)) {
					return
				}
				if (method.__no_as_com_proto__ ||
					no_as_com_protos.some(no_proto_name => no_proto_name === proto_name) ||
					(proto_name.charAt(0) === "_" && !method.__as_com_proto__)) {
					return
				}
				var method_doc = {
					name: proto_name
				};
				var _doc = method.__as_com_proto__,
					_doc_params;
				if (Array.isArray(_doc)) {
					_doc_params = _doc;
				} else if (Object.isObject(_doc)) {
					String.isString(_doc.des) && (method_doc.des = _doc.des);
					_doc_params = _doc.params;
				} else if (String.isString(method.__as_com_proto__)) {
					method_doc.des = method.__as_com_proto__;
				}

				method_doc.params = getParamsDoc(method, _doc_params);
				methods[proto_name] = method_doc;
			});
			method_obj = method_obj.__proto__;
		}
		doc.methods = methods.$toArray();

		/*生成Prototypes-DOC*/
		doc.properties = Array.isArray(doc.properties) ? doc.properties.filterMap(formatItemDoc) : [];
		if (prototype_obj) {
			var properties_map = doc.properties.toMap("name");
			Object.getOwnPropertyNames(prototype_obj).forEach(proto_name => {
				if (properties_map.$hasPro(proto_name)) {
					return
				}

				var proto = prototype_obj[proto_name];
				if (Function.isFunction(proto)) { //函数以外的任意对象都可以
					return
				}
				if (proto.__no_as_com_proto__ ||
					no_as_com_protos.some(no_proto_name => no_proto_name === proto_name) ||
					(proto_name.charAt(0) === "_" && !proto.__as_com_proto__)) {
					return
				}

				properties_map[proto_name] = {
					name: proto_name,
					type: proto == undefined /*undefined||null*/ ? "" : typeof proto,
				};
			});
			doc.properties = properties_map.$toArray();
		}

		return {
			document: doc,
			component_type: com_type
		}
	}
};

var ComponentSandboxFactory = require("./component-sanbox").ComponentSandboxFactory;
var componentSandboxOrders = require("./component-sanbox").componentSandboxOrders;
exports.registerComponent = registerComponent;
/*
 * 注册组件，以及响应组件实例的生成
 */
function registerComponent(socket) {
	var components = socket.registeredComponents = new Map();
	var tasks = new Map();

	socket.registerComponent = function(com_name, doc, com) {
		if (!String.isString(com_name)) {
			Throw("type", "component-name must be string");
		}
		if (tasks.has(com_name) || components.has(com_name)) {
			Throw("ref", com_name + " has been used");
		}
		if (arguments.length < 3) {
			com = doc;
			doc = {};
		};
		var componentDoc = socket.buildComponentDoc(doc, com)

		return new Promise(function(resolve, reject) {
			socket.msgInfo("component-register", {
				doc: componentDoc.document,
				name: com_name
			});
			tasks.set(com_name, {
				resolve: resolve,
				reject: reject,
				com: com,
				doc: componentDoc.document,
				type: componentDoc.component_type,
			});
		});
	};
	socket.onMsgSuccess("component-register", function(data, done) {
		var com_name = data.info.name;
		var task = tasks.get(com_name);
		if (task) {
			tasks.delete(com_name);
			components.set(com_name, {
				com: task.com,
				doc: task.doc,
				type: task.type,
			});
			task.resolve(data.info);
		}
		done();
	});
	socket.onMsgError("component-register", function(data, done) {
		var com_name = data.info.name;
		var task = tasks.get(com_name);
		if (task) {
			tasks.delete(com_name);
			task.reject(data.msg)
		}
		done()
	});

	/*
	 * on init component
	 */

	// 根据safe_task_id保存沙盒环境上下文对象
	var componentSandboxFactory = socket.componentSandboxFactory = new ComponentSandboxFactory;

	socket.onMsgInfo("init-component", function(data, done) {
		// 从服务端发来的，所以已经确保和register的数据是同步了，com_name是在Server校验过的。
		try {
			var safe_task_id = data.info.task_id;
			if (!safe_task_id) {
				Throw("ref", "safe_task_id must be Unique-String.");
			}
			if (componentSandboxFactory.has(safe_task_id)) {
				Throw("ref", "safe_task_id aleary be used.");
			}
			var com_name = data.info.com_name;
			var com_info = components.get(com_name);
			if (!com_info) {
				Throw("ref", "lost Component-Constructor<" + com_name + ">");
			}

			componentSandboxFactory.buildComponentSandbox(com_info.com, com_info.type, data.info.init_protos, safe_task_id);

			// 跟着DOC对象提供接口
			var protos = {};
			protos.methods = Array.asArray(com_info.doc.methods).map(method_info => method_info.name);
			protos.properties = Array.asArray(com_info.doc.properties).map(property_info => property_info.name);

			console.log("[COMPONENT NAME]: ".colorsHead(), com_name);

			socket.msgSuccess("init-component", {
				task_id: safe_task_id,
				protos: protos
			});
		} catch (err) {
			console.flag("init-component", err.message, "\n", err.stack);
			socket.msgError("init-component", {
				task_id: safe_task_id
			}, Error.isError(err) ? err.message : err);
		}
		done();
	});

	/*
	 * on order component
	 */

	// 根据safe_task_id获取沙盒环境上下文对象
	socket.onMsgInfo("order-component", function(data, done) {
		co(function*() {
			var safe_task_id = data.info.task_id;
			if (!safe_task_id) {
				Throw("ref", "safe_task_id must be Unique-String.");
			}
			var com_sandbox = componentSandboxFactory.get(safe_task_id);
			if (!com_sandbox) {
				Throw("ref", "safe_task_id has no reference to sandbox.");
			}
			var safe_order_id = data.info.order_id;
			if (!safe_order_id) {
				Throw("ref", "safe_order_id must be Unique-String.");
			}

			var order = String.asString(data.info.order);
			if (!order) {
				Throw("type", "order must be String.");
			}

			var order_handle = componentSandboxOrders[order];

			if (!order_handle || order_handle.types.indexOf(com_sandbox.type) === -1) {
				Throw("type", "Can not find " + com_sandbox.type + "'s order: " + order);
			}
			var order_res = yield order_handle.handle(com_sandbox, data.info.data);

			socket.msgSuccess("order-component", {
				task_id: safe_task_id,
				order_id: safe_order_id,
				returns: order_res,
			});
			done();
		}).catch(err => {
			console.flag("order-component", err.message, "\n", err.stack);
			socket.msgError("order-component", {
				task_id: safe_task_id,
				order_id: safe_order_id,
			}, Error.isError(err) ? err.message : err);
			done();
		});
	});
};

exports.initComponent = initComponent;
/*
 *  初始化组件
 * Client->Server-Client通用
 */
function initComponent(socket, is_server) {
	var init_com_tasks = new Map();
	if (is_server) {
		/*
		 * 服务层的只需转发init-component指令
		 */
		socket.callInitComponent = function(task_id, com_name, init_protos) {
			var info = {};
			info.task_id = task_id;
			info.init_protos = init_protos;
			info.com_name = com_name;

			return new Promise(function(resolve, reject) {
				socket.msgInfo("init-component", info);
				init_com_tasks.set(info.task_id, {
					resolve: resolve,
					reject: reject,
				});
			});
		};
	} else {
		/*
		 * 用户层的发送并接收后，需要将接受的数据进一步做处理
		 */
		socket.initComponent = function(app_name, com_name, init_protos) {
			var info = {};
			if (arguments.length < 3) {
				init_protos = com_name;
				com_name = app_name;
				app_name = null;
			} else {
				info.app_name = app_name;
			}
			info.task_id = $$.uuid("CLIENT-TASK-ID@");
			info.init_protos = init_protos;
			info.com_name = com_name;

			return new Promise(function(resolve, reject) {
				socket.msgInfo("init-component", info);
				init_com_tasks.set(info.task_id, {
					resolve: resolve,
					reject: reject,
				});
			}).then(function(com_instance) {
				var com_instance_proxy = function(order, data) {
					return socket.orderComponent(info.task_id, order, data);
				};
				com_instance.protos.methods.forEach(key => {
					function component_proxy_method_runner() {
						return com_instance_proxy("run-method", {
							name: key,
							args: Array.slice(arguments)
						});
					}
					com_instance_proxy.__defineGetter__(key, () => {
						return component_proxy_method_runner
					});
				});
				com_instance.protos.properties.forEach(key => {
					com_instance_proxy.__defineGetter__(key, () => {
						return com_instance_proxy("get-property", key);
					});
					com_instance_proxy.__defineSetter__(key, value => {
						return com_instance_proxy("set-property", {
							key: key,
							value: value
						});
					});
				});
				return com_instance_proxy;
			});
		};
	}
	socket.onMsgSuccess("init-component", function(data, done) {
		var task_id = data.info && data.info.task_id;
		var task = init_com_tasks.get(task_id);
		if (task) {
			init_com_tasks.delete(task_id);
			task.resolve(data.info);
		}
		done();
	});

	socket.onMsgError("init-component", function(data, done) {
		var task_id = data.info && data.info.task_id;
		var task = init_com_tasks.get(task_id);
		if (task) {
			init_com_tasks.delete(task_id);
			task.reject(data.msg);
		}
		done();
	});
};

exports.orderComponent = orderComponent;
/*
 * 运行组件
 * Client->Server-Client通用
 */
function orderComponent(socket, is_server) {
	var orders = new Map();
	if (is_server) {
		socket.callOrderComponent = function(info) {
			return new Promise(function(resolve, reject) {
				/*
				info = 
				{
					task_id: task_id,
					order_id: order_id,
					order: order,
					data: data
				}
				*/
				socket.msgInfo("order-component", info);
				orders.set(info.order_id, {
					resolve: resolve,
					reject: reject,
				});
			});
		};
	} else {
		socket.orderComponent = function(task_id, order, data) {
			if (!String.asString(task_id)) {
				Throw("type", "task_id must be Unique-String");
			}
			if (!String.asString(order)) {
				Throw("type", "order must be String");
			}
			var order_id = $$.uuid("ORDER-ID@");

			return new Promise(function(resolve, reject) {
				socket.msgInfo("order-component", {
					task_id: task_id,
					order_id: order_id,
					order: order,
					data: data
				});
				orders.set(order_id, {
					resolve: resolve,
					reject: reject,
				});
			});
		};
	}
	socket.onMsgSuccess("order-component", function(data, done) {
		var order_id = data.info && data.info.order_id;
		var order = orders.get(order_id);
		if (order) {
			orders.delete(order_id);
			order.resolve(data.info.returns);
		}
		done();
	});

	socket.onMsgError("order-component", function(data, done) {
		var order_id = data.info && data.info.order_id;
		var order = orders.get(order_id);
		if (order) {
			orders.delete(order_id);
			order.reject(data.msg);
		}
		done();
	});
}