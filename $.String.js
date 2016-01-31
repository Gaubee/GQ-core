require("./$.Object");
//字符串拼接
String.prototype.setUnEnum("format", function(args) {
	var result = this;
	if (arguments.length > 0) {
		if (arguments.length == 1 && typeof(args) == "object") {
			for (var key in args) {
				if (args[key] != undefined) {
					var reg = new RegExp("({" + key + "})", "g");
					result = result.replace(reg, args[key]);
				}
			}
		} else {
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] != undefined) {
					//var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
					　　　　　　　　　　　　
					var reg = new RegExp("({)" + i + "(})", "g");
					result = result.replace(reg, arguments[i]);
				}
			}
		}
	}
	return result;
});
//解析成Object
String.prototype.setUnEnum("parseJSON", function() {
	return JSON.parse(this);
});

String.prototype.setUnEnum("startWith", function(str) {
	return this.indexOf(str) === 0;
});
String.prototype.setUnEnum("endWith", function(str) {
	var index = this.indexOf(str);
	return index >= 0 && index === this.length - str.length;
});

//类型判断
String.isString = function(str) {
	return typeof str === "string";
};

//转驼峰
String.prototype.setUnEnum("camelize", function() {
	//转换为驼峰风格
	if (this.indexOf("-") < 0 && this.indexOf("_") < 0 && this.indexOf(".") < 0) {
		return this
	}
	return this.replace(/[-_.][^-_.]/g, function(match) {
		return match.charAt(1).toUpperCase()
	})
});

//转下划线命名
String.prototype.setUnEnum("underlize", function() {
	var _A = "A";
	var _Z = "Z";
	var res = this.charAt(0);
	for (var i = 1, len = this.length; i < len; i += 1) {
		var c = this.charAt(i);
		if (c >= _A && c <= _Z && this.charAt(i - 1) !== "_") {
			res += "_"
		}
		res += c
	};
	return res.toLowerCase();
});

// console.log("_UserNameC".unberlize())

//数字化
String.prototype.setUnEnum("toInt", function(n) {
	return parseInt(this, n);
});
String.prototype.setUnEnum("toFloat", function(n) {
	return parseFloat(this, n);
});

//替换全部

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};
String.replaceAll = function(string, find, replace) {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};
String.prototype.setUnEnum("replaceAll", function(find, replace) {
	return String.replaceAll(this, find, replace);
});

//字符串数值化
String.toCharCodeNumber = function(str) {
	var res = 0;
	for (var i = 0, len = str.length; i < len; i += 1) {
		res += str.charCodeAt(i);
	}
	return res;
};
String.prototype.setUnEnum("toCharCodeNumber", function() {
	return String.toCharCodeNumber(this)
});
//添加空格进行占位
String.placeholder = function(str, num, over_str) {
	return str.length > num ? (str + over_str || "") : (str + Array(num).join(" ")).substr(0, num);
};
String.prototype.setUnEnum("placeholder", function(num, over_str) {
	return String.placeholder(this, num, over_str)
});

//颜色化，用于控制台的输出
var colors = require("colors");
String.colors = colors;
var _text_colors = [
	"yellow",
	"blue",
	"magenta",
	"cyan",
	"red",
	"green"
];
String.prototype.setUnEnum("colorsHead", function(to_color) {
	return this.replace(/\[(.)+\]/, function(head) {
		if (!(to_color && colors[to_color])) {
			var _head = head.replace(/\s/g, "");
			to_color = _text_colors[((_head.toCharCodeNumber() % _text_colors.length) + _head.length) % _text_colors.length];
		}
		return colors[to_color](head);
	});
});

//字符串转化成正则
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
String.toRegExp = function(str) {
	if (!(str instanceof RegExp)) {
		str = new RegExp(String(str).replace(matchOperatorsRe, '\\$&'));
	}
	return str
}