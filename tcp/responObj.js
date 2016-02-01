var refresh_html_template = `<html><meta http-equiv="refresh" content="0;url={refresh_url}"></html>`;

function ResponObjError(errorMsg) {
	if (!(this instanceof ResponObjError)) {
		return new ResponObjError(errorMsg);
	}
	if (errorMsg.details) {
		errorMsg = errorMsg.details
	} else if (errorMsg.message) {
		errorMsg = errorMsg.message
	}

	this.errorMsg = errorMsg;
	this.errorTime = +new Date;
};
ResponObjError.prototype = {
	toString: function() {
		try {
			var result = JSON.stringify(this);
		} catch (e) {
			result = JSON.stringify(String(e));
		}
		return result;
	}
};

function ResponObj(type, obj) {
	type = type.toLowerCase();
	//TODO:加入压缩、加密功能，客户端将自动解压、解密
	var result;
	switch (type) {
		case "error":
			result = {
				type: "error",
				info: new ResponObjError(obj)
			};
			break;
		case "object":
		case "json":
			result = {
				type: "json",
				info: obj
			};
			break;
		case "html":
			result = {
				type: "html",
				info: obj
			};
			break;
		case "refresh":
			if (typeof obj === "string") {
				obj = {
					refresh_url: obj
				}
			};
			result = refresh_html_template.format(obj);
			break;
		default:
			result = {
				type: type,
				info: String(obj)
			};
	};
	return result;
}
module.exports = ResponObj;