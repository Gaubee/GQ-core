// client 拓展 出Router指令
exports.handleClient = handleClient;
const Context = require("./Context");

function handleClient(socket) {
	// 缓存变量
	const tasks = exports.routerTasks = new Map();
	const handles = exports.routerHandles = new Map();

	socket.HTTPContext = Context;

	// 默认的响应数据包裹
	socket.TaskResponObj = require("./responObj");

	//响应器
	socket.onMsgInfo("emit-task", co.wrap(function*(data, done) {
		try {
			const task_info = data.info;
			const handle_id = `[${task_info.method.toLowerCase()}]${task_info.path}`;
			if (handles.has(handle_id)) {
				const router_handle = handles.get(handle_id);
				yield router_handle.handle.call(new Context(socket, task_info, router_handle.config),
					task_info, router_handle.config);
				/*
				 * 可能会被其它监听器所处理，这时候抛出异常，服务端可能会返回找不到句柄的异常
				 */
			// } else {
			// 	Throw("ref", "RouterHandle no defined");
			}
		} catch (e) {
			console.log("data_info.task_id:", task_info);
			console.flag("emit-task", e);
			socket.returnData(task_info.task_id, {
				status: 502,
				body: socket.TaskResponObj("error", e)
			});
		}
		done();
	}));

	// 路由注册器
	socket.registerRouter = function(method, path, router_info, handle) {
		var handle_id = `[${method.toLowerCase()}]${path}`;
		if (!String.isString(method)) {
			Throw("type", console.flagHead(handle_id) + ": " + "METHOD mush be string.");
		}
		if (!String.isString(path)) {
			Throw("type", console.flagHead(handle_id) + ": " + "PATH mush be string.");
		}
		if (!Object.isObject(router_info)) {
			Throw("type", console.flagHead(handle_id) + ": " + "ROUTER_INFO mush be object.");
		}
		if (!Function.isFunction(handle)) {
			Throw("type", console.flagHead(handle_id) + ": " + "HANDLE mush be function.");
		} else if (Function.isGeneratorFunction(handle)) {
			handle = co.wrap(handle);
		} else if (!(Function.isFunction(handle.__generatorFunction__) && handle.name === "createPromise")) {
			handle = co.wrap(handle);
		}
		if (tasks.has(handle_id) || handles.has(handle_id)) {
			throw handle_id + " has been used"
		}
		return new Promise(function(resolve, reject) {
			tasks.set(handle_id, {
				resolve: resolve,
				reject: reject,
				handle: handle
			});
			router_info.method = method;
			router_info.path = path;
			socket.msgInfo("router-register", router_info);
			console.log("  ", handle_id.colorsHead());
		});
	};
	//回调响应
	socket.onMsgSuccess("router-register", function(data, done) {
		var register_info = data.info;
		var handle_id = `[${register_info.method.toLowerCase()}]${register_info.path}`;
		var task = tasks.get(handle_id);
		tasks.delete(handle_id);
		if (task) {
			task.resolve(register_info);
			handles.set(handle_id, {
				config: register_info,
				handle: task.handle
			});
		}
		done();
	});
	socket.onMsgError("router-register", function(data, done) {
		var register_info = data.info;
		var handle_id = `[${register_info.method.toLowerCase()}]${register_info.path}`;
		var task = tasks.get(handle_id);
		tasks.delete(handle_id);
		if (task) {
			task.reject(data.msg);
		}
		done();
	});
	// 回调请求结果
	socket.returnData = function(task_id, data) {
		socket.msgInfo("return-task", {
			task_id: task_id,
			return_data: data
		});
	};
	// 批量注册接口，取出dir文件夹下的所有extname后缀的文件
	socket.multiRegisterRouter = function(dir, extname) {
		var res = [];
		String.isString(extname) || (extname = ".r.js");
		fs.lsAll(dir).forEach(file_path => {
			if (file_path.endWith(extname)) {
				console.group(console.flagHead("router-install"));
				var routers = require(file_path);
				if (routers) {
					if (Function.isFunction(routers.install)) {
						routers = routers.install(socket);
					}
					if (Object.isObject(routers)) {
						res = res.concat(socket.routerInstaller(routers));
					} else {
						console.error(console.flagHead("RouterModule"), file_path, "wrong routers-object")
					}
				} else {
					console.error(console.flagHead("RouterModule"), file_path, "wrong routers-object")
				}
				console.groupEnd(console.flagHead("router-install"));
			}
		});
		return res;
	};
	// 对向型接口安装器
	socket.routerInstaller = function RouterInstaller(routers) {
		var res = [];
		var prefix = routers.prefix || "";
		Object.keys(routers).forEach(method => {
			if (["get", "post", "put", "delete"].indexOf(method.toLowerCase()) === -1) {
				return
			}
			var router = routers[method];
			Object.keys(router).forEach(path => {
				var router_info_and_handle = router[path];
				if (Array.isArray(router_info_and_handle)) {
					if (router_info_and_handle.length > 1) {
						var register_info = router_info_and_handle[0];
						var router_handle = router_info_and_handle[1];
					} else {
						register_info = {};
						router_handle = router_info_and_handle[0];
					}
				} else {
					register_info = {};
					router_handle = router_info_and_handle;
				}

				res.push(socket.registerRouter(method, prefix + path, register_info, router_handle));
			});
		});
		return res;
	};
}