require("./$.Object");

Date.prototype.setUnEnum("format", function(format) {
	var o = {
		"Q+": Math.floor((this.getMonth() + 3) / 3), //quarter
		"M+": this.getMonth() + 1, //month
		"D+": this.getDate(), //day
		"h+": this.getHours(), //hour
		"m+": this.getMinutes(), //minute
		"s+": this.getSeconds(), //second
		"S": this.getMilliseconds() //millisecond
	};
	if (/(Y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(format))
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
	return format;
});