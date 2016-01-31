exports.handleSocket = handleSocket;

function handleSocket(socket) {
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
	socket.onMsgSuccess = function(type) {
		var args = Array.slice(arguments);
		args[0] = "msg:success:" + type
		socket.on.apply(socket, args);
	};

};