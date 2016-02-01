// client 拓展 出Redis指令
exports.handleClient = handleClient;

function handleClient(socket) {
	var tasks = exports.redisTasks = new Map();
	socket.redisExec = function(handle, args) {
		var task_id = $$.uuid("REDIS-EXEC-TASK-ID-");
		return new Promise(function(resolve, reject) {
			tasks.set(task_id, {
				resolve: resolve,
				reject: reject
			});
			socket.msgInfo("redis-exec", {
				task_id: task_id,
				handle: handle,
				args: args
			});
		});
	};
	socket.onMsgSuccess("redis-return", function(data, done) {
		// console.log(data.info.task_id);
		var task = tasks.get(data.info.task_id);
		tasks.delete(data.info.task_id);
		if (task) {
			task.resolve(data.info.returns);
		}
		done();
	});
	socket.onMsgError("redis-return", function(data, done) {
		// console.log(data.info.task_id);
		var task = tasks.get(data.info.task_id);
		tasks.delete(data.info.task_id);
		if (task) {
			task.reject(data.msg);
		}
		done();
	});
}