// client 拓展 出Component指令
exports.handleClient = handleClient;

function handleClient(socket) {
	registerComponent(socket);
	initComponent(socket);
};

exports.registerComponent = registerComponent;
/*
 * 注册组件，以及响应组件实例的生成
 */
function registerComponent(socket) {
	var components = new Map();
	var tasks = new Map();

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
	}

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
		if (String.isString(doc)) {
			doc = {
				des: doc
			};
		} else if (Object.isObject(doc)) {
			doc = {
				des: doc.des,
				init_protos: doc.init_protos,
				methods: doc.methods,
				prototypes: doc.prototypes,
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
		if (Function.isFunction(com)) {
			doc.init_protos = getParamsDoc(com, doc.init_protos);

			if (Function.isClass(com)) {
				method_obj = com.prototype;
			}
		} else if (Object.isObject(com)) {
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
		doc.prototypes = Array.isArray(doc.prototypes) ? doc.prototypes.filterMap(formatItemDoc) : [];
		if (prototype_obj) {
			var prototypes_map = doc.prototypes.toMap("name");
			Object.getOwnPropertyNames(prototype_obj).forEach(proto_name => {
				if (prototypes_map.$hasPro(proto_name)) {
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

				prototypes_map[proto_name] = {
					name: proto_name,
					type: proto == undefined /*undefined||null*/ ? "" : typeof proto,
				};
			});
			doc.prototypes = prototypes_map.$toArray();
		}

		return new Promise(function(reslove, reject) {
			socket.msgInfo("component-register", {
				doc: doc,
				name: com_name
			});
			tasks.set(com_name, {
				reslove: reslove,
				reject: reject,
				com: com,
				doc: doc
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
				doc: task.doc
			});
			task.reslove(data.info);
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
	// on init component
	// 从服务端发来的，所以已经确保和register的数据是同步了，com_name是在Server校验过的。
	socket.onMsgInfo("init-component", function(data, done) {
		var task_id = data.info.task_id;
		var com_name = data.info.com_name;
		console.flag("on init component", data.info)
		var com_and_doc = components.get(com_name);
		if (com_and_doc) {
			socket.msgSuccess("init-component", {
				task_id: task_id,
				protos: com_and_doc.doc.methods.toMap("name")
			});
		} else {
			socket.msgError("init-component", {
				task_id: task_id
			}, "lost Component-Constructor<" + com_name + ">")
		}
		done();
	});
};

exports.initComponent = initComponent;
/*
 * 使用组件
 * Client->Server-Client通用
 */
function initComponent(socket, is_server) {
	var init_com_tasks = new Map();
	if (is_server) {
		socket.callInitComponent = function(task_id, com_name, init_protos) {
			var info = {};
			info.task_id = task_id;
			info.init_protos = init_protos;
			info.com_name = com_name;

			return new Promise(function(reslove, reject) {
				socket.msgInfo("init-component", info);
				init_com_tasks.set(info.task_id, {
					reslove: reslove,
					reject: reject,
				});
			});
		};
	} else {
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

			return new Promise(function(reslove, reject) {
				socket.msgInfo("init-component", info);
				init_com_tasks.set(info.task_id, {
					reslove: reslove,
					reject: reject,
				});
			});
		};
	}
	socket.onMsgSuccess("init-component", function(data, done) {
		var task_id = data.info && data.info.task_id;
		var task = init_com_tasks.get(task_id);
		if (task) {
			init_com_tasks.delete(task_id);
			task.reslove(data.info);
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