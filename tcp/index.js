require("../Console");
require("../$.generator");
var ChunkHandle = require("./ChunkHandle");
var msgHandle = require("./msg");
var redisExtendHandle = require("./extends-redis.js");
var routerExtendHandle = require("./extends-router.js");
var appExtendHandle = require("./extends-app.js");
var comExtendHandle = require("./extends-com.js");
var net = require("net");
exports.net = net;
exports.handleSocket = handleSocket;

exports.config = {
	hiddenFlags: new Set()
};

function handleSocket(socket, options) {
	"use strict";
	var chuck_handle = ChunkHandle(socket);
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
			var hiddenFlags = config.hiddenFlags;
			$$.runGEN(function*(resume) {
				var _flag = data.type + (data.from ? (":" + data.from) : "");
				var _is_hidden = hiddenFlags.has(_flag);
				let _group = console.flagHead("<<< msg:" + _flag) + " " + (data.msg || "");
				_is_hidden || console.group(_group);

				yield GEN_emit("msg:" + data.type, data, resume);
				if (data.from) {
					yield GEN_emit("msg:" + data.type + ":" + data.from, data, resume);
				}

				_is_hidden || console.groupEnd(_group);
			});
		}
	});
	// 错误处理
	socket.on("error", function(e) {
		console.flag("TCP ERROR", socket._id, e.stack);
	});
	socket.on("close", function(e) {
		console.flag("TCP CLOSE", socket._id, e);
	});

	// 封装msg事件
	msgHandle.handleSocket(socket);

	return socket;
};

exports.createServer = createServer;

function createServer(address, callback) {
	var server = net.createServer(function(socket) { // on("connection")
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
	//Model-Redis的拓展
	redisExtendHandle.handleClient(client);
	//Router拓展
	routerExtendHandle.handleClient(client);
	//App拓展
	appExtendHandle.handleClient(client);
	//Component拓展
	comExtendHandle.handleClient(client);

	//删除没用的日志打印
	var hiddenFlags = exports.config.hiddenFlags;
	hiddenFlags.add("success:return-task");
	hiddenFlags.add("success:router-register");
	hiddenFlags.add("success:component-register");

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