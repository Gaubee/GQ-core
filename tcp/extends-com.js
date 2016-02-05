// client 拓展 出Component指令
exports.handleClient = handleClient;

function handleClient(socket) {
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
			components.set(com_name, com);
			doc.init_protos = getParamsDoc(com, doc.init_protos);

			if (Function.isClass(com)) {
				method_obj = com.prototype;
			}
		} else if (Object.isObject(com)) {
			components.set(com_name, com);
			method_obj = com;
			prototype_obj = com;
		}
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
				reject: reject
			});
		});
	};
	socket.onMsgSuccess("component-register", function(data, done) {
		var com_name = data.info.name;
		var task = tasks.get(com_name);
		if (task) {
			tasks.delete(com_name);
			task.reslove(data.info)
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
};