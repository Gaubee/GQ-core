var ResponObj = require("./responObj");
module.exports = Context;

function Context(socket, task_info, register_config) {

	register_config.emit_with.forEach((key, index) => {
		task_info[key] = task_info.emit_with[index]
	});

	this.socket = socket;
	this.task_info = task_info;
	this.set_cookies = [];

	this.body_type; // TaskResponObj的第一个参数，可空，默认用typeof body

	this.no_wrap_body = false; // Boolean 是否用TaskResponObj包裹结果

	var ctx = this;
	this.w = $$.When(1, function() {
		socket.returnData(task_info.task_id, {
			status: ctx._status,
			set_cookies: ctx.set_cookies.length && ctx.set_cookies,
			response_type: ctx.response_type,
			body: ctx.no_wrap_body ? ctx._body : socket.TaskResponObj(
				ctx.body_type || typeof ctx._body,
				ctx._body
			),
			session: ctx.session
		});
	});
};

Context.prototype = {
	get session() {
		return this.task_info.session || (this.task_info.session = {});
	},
	get query() {
		return this.task_info.query || {}
	},
	get params() {
		return this.task_info.params || {}
	},
	get form() {
		return this.task_info.form || {}
	},
	get status() {
		return this._status
	},
	set status(val) {
		this._status = parseInt(val);
	},
	cookies: (function() {
		var ctx = this;
		return {
			set: function() {
				ctx.set_cookies.push(Array.slice(arguments));
			},
			get: function() {

			}
		}
	}),
	get body() {
		return this._body;
	},
	set body(val) {
		this._body = val;
		this.w.ok(0);
	},
	get type() {
		return this.response_type
	},
	set type(val) {
		this.response_type = val
	}
}