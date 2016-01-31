require("./Console");
var net = require("net");
exports.net = net;
exports.handleSocket = handleSocket;

exports.config = {
	hidden_groups: {}
};

function handleSocket(socket) {
	var _content_length = 0;
	var _buffer_cache = [];
	var chuck_handle = {
		get_content_length: function(chunk) {
			// content_length \0 content
			// 可能会因为\0而导致数据包分开来导入
			// 如果是，那么就要有一步进行拼接
			// 如果拼接过还有问题的话，就要报错了
			if (_buffer_cache.length) {
				_buffer_cache.push(chunk);
				chunk = Buffer.concat(_buffer_cache);
				var _is_use_concat = true
				_buffer_cache = [];
			}
			// [0, 1, \0, a, b] 5 - 2 - 1
			var _split_index = chunk.indexOf("\0");
			if (_split_index > 0) {
				var _content_length_buffer = chunk.slice(0, _split_index);
				_content_length = parseInt(_content_length_buffer);
			}
			if (!_content_length) {
				if (_is_use_concat) {
					console.error("错误的数据块", chunk.toString(), (new Error).stack);
				} else {
					// 可能是数据块不完整
					// 先存入缓存中
					_buffer_cache.push(chunk);
				}
				return
			}

			chuck_handle.run = chuck_handle.concat_content;
			var _remain_buffer = chunk.slice(_split_index + 1); //排除掉\0字符

			// 考虑到content-length \0 后面就没东西了，就没必要解析了
			_remain_buffer.length && chuck_handle.run(_remain_buffer);
		},
		concat_content: function(chunk) {
			var _chunk_length = chunk.length;
			if (_chunk_length <= _content_length) { //还没到终点，直接放入缓存中
				_buffer_cache.push(chunk);
				_content_length -= _chunk_length;
				if (_content_length === 0) {
					chuck_handle.parse_content();
				}
			} else { //遇到粘包的情况，分开来搞
				var _current_buffer = chunk.slice(0, _content_length);
				var _remain_buffer = chunk.slice(_content_length);

				//当下的所需的数据块切出，进入解析器
				_buffer_cache.push(_current_buffer);
				_content_length = 0;
				chuck_handle.parse_content();

				//剩余的包重新进入下一轮的解析
				chuck_handle.get_content_length(_remain_buffer);
			}
		},
		parse_content: function() {
			chuck_handle.run = chuck_handle.get_content_length;
			try {
				var _result_str = Buffer.concat(_buffer_cache);
				var result = JSON.parse(_result_str, (key, value) => {
					return value && value.type === 'Buffer' && (Array.isArray(value.data) || typeof value.data === "string") ? new Buffer(value.data) : value;
				});
				_buffer_cache = [];
			} catch (e) {
				console.error("数据解析出错", e.stack, _buffer_cache, _result_str.toString());
				_buffer_cache = [];
				return;
			}
			socket.emit("msg", result);
		}
	};
	//初始化
	chuck_handle.run = chuck_handle.get_content_length;
	//监听数据接收
	socket.on("data", function(chunk) {
		chuck_handle.run(chunk);
	});
	//封装发送的函数
	socket.msg = function(data, cb) {
		var buffer = new Buffer(JSON.stringify(data));
		socket.write(buffer.length.toString());
		socket.write('\0');
		socket.write(buffer, cb);
	};
	//封装不同状态机的讯息
	//触发器
	var GEN_emit = function(eventName, data, resume) {
		var len = socket.listeners(eventName).length;
		if (len) {
			var w = new $$.When(len, resume);
			var i = 0;
			socket.emit(eventName, data, function() {
				w.ok(i++);
			});
		} else {
			resume();
		}
	};
	socket.on("msg", function(data) {
		if (data && data.type && data.info) {
			var config = exports.config || {};
			var hidden_groups = config.hidden_groups || {};
			$$.runGEN(function*(resume) {
				var _flag = data.type + (data.from ? (":" + data.from) : "");
				var _is_hidden = !!hidden_groups[_flag];
				var _group = console.flagHead("<<< msg:" + _flag) + " " + (data.msg || "");
				_is_hidden || console.group(_group);
				yield GEN_emit("msg:" + data.type, data, resume);
				if (data.from) {
					yield GEN_emit("msg:" + data.type + ":" + data.from, data, resume);
				}
				_is_hidden || console.groupEnd(_group);
			});
		}
	});
	//INFO
	socket.msgInfo = function(type, extend_info) {
		console.flag(">>> msg:info", type);
		socket.msg({
			type: type,
			info: extend_info
		});
	};
	socket.onMsgInfo = function(type) {
		var args = Array.slice(arguments);
		args[0] = "msg:" + type
		socket.on.apply(socket, args);
	};
	//ERROR
	socket.msgError = function(type, extend_info, errorMsg) {
		console.flag(">>> msg:error:" + type, errorMsg || "");
		socket.msg({
			type: "error",
			from: type,
			msg: errorMsg,
			info: extend_info
		});
	};
	// socket.on("msg:error", function(data) {
	// 	console.flag("error " + data.from, data.msg || "");
	// 	socket.emit("msg:error:" + data.from);
	// });
	socket.onMsgError = function(type) {
		var args = Array.slice(arguments);
		args[0] = "msg:error:" + type
		socket.on.apply(socket, args);
	};
	//SUCCESS
	socket.msgSuccess = function(type, extend_info, successMsg) {
		console.flag(">>> msg:success:" + type, successMsg || "");
		socket.msg({
			type: "success",
			from: type,
			msg: successMsg,
			info: extend_info
		});
	};
	// socket.on("msg:success", function(data) {
	// 	$$.runGEN(function*(resume) {
	// 		console.group(console.flagHead("success " + data.from), data.msg || "");
	// 		yield socket.emit("msg:success:" + data.from, data, resume);
	// 		console.groupEnd(console.flagHead("success " + data.from), data.msg || "");
	// 	});
	// });
	socket.onMsgSuccess = function(type) {
		var args = Array.slice(arguments);
		args[0] = "msg:success:" + type
		socket.on.apply(socket, args);
	};

	// 错误处理
	socket.on("error", function(e) {
		console.flag("TCP ERROR", socket._id, e.stack);
	});
	socket.on("close", function(e) {
		console.flag("TCP CLOSE", socket._id, e);
	});
	return socket;
};

exports.createServer = createServer;

function createServer(address, callback) {
	var server = net.createServer(function(socket) {
		socket._id || (socket._id = "SOCKET@" + Math.random().toString(16).substr(2));
		handleSocket(socket);
	});
	if (address) {
		server.listen(address, callback)
	}
	return server;
};

exports.createClient = createClient;

function createClient(address, callback) {
	var client = net.connect(address, callback);
	handleSocket(client);
	return client;
};
exports.errorWrap = errorWrap;
//处理错误信息，使得能够JSON化
function errorWrap(err) {
	if (typeof err === "object" && !err.details) {
		err.details = err.message;
	} else {
		err = {
			details: err
		};
	}
	return err;
};