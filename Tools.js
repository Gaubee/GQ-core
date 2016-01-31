var $Object = require("./$.Object");
var fs = require("fs");
var tld = require('tldjs');

var folder_name_reg = /^[^\\\.\/\:\*\?\”\|]{1}[^\\\/\:\*\?\”\|]{0,200}$/;
/*
根据〖中华人民共和国国家标准 GB 11643-1999〗中有关公民身份号码的规定，公民身份号码是特征组合码，由十七位数字本体码和一位数字校验码组成。排列顺序从左至右依次为：六位数字地址码，八位数字出生日期码，三位数字顺序码和一位数字校验码。
    地址码表示编码对象常住户口所在县(市、旗、区)的行政区划代码。
    出生日期码表示编码对象出生的年、月、日，其中年份用四位数字表示，年、月、日之间不用分隔符。
    顺序码表示同一地址码所标识的区域范围内，对同年、月、日出生的人员编定的顺序号。顺序码的奇数分给男性，偶数分给女性。
    校验码是根据前面十七位数字码，按照ISO 7064:1983.MOD 11-2校验码计算出来的检验码。

出生日期计算方法。
    15位的身份证编码首先把出生年扩展为4位，简单的就是增加一个19或18,这样就包含了所有1800-1999年出生的人;
    2000年后出生的肯定都是18位的了没有这个烦恼，至于1800年前出生的,那啥那时应该还没身份证号这个东东，⊙﹏⊙b汗...
下面是正则表达式:
 出生日期1800-2099  (18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])
 身份证正则表达式 /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i            
 15位校验规则 6位地址编码+6位出生日期+3位顺序号
 18位校验规则 6位地址编码+8位出生日期+3位顺序号+1位校验位
 
 校验位规则     公式:∑(ai×Wi)(mod 11)……………………………………(1)
                公式(1)中： 
                i----表示号码字符从由至左包括校验码在内的位置序号； 
                ai----表示第i位置上的号码字符值； 
                Wi----示第i位置上的加权因子，其数值依据公式Wi=2^(n-1）(mod 11)计算得出。
                i 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
                Wi 7 9 10 5 8 4 2 1 6 3 7 9 10 5 8 4 2 1

*/
//身份证号合法性验证 
//支持15位和18位身份证号
//支持地址编码、出生日期、校验位验证
function IdentityCodeValid(code) {
    var city = {
        11: "北京",
        12: "天津",
        13: "河北",
        14: "山西",
        15: "内蒙古",
        21: "辽宁",
        22: "吉林",
        23: "黑龙江 ",
        31: "上海",
        32: "江苏",
        33: "浙江",
        34: "安徽",
        35: "福建",
        36: "江西",
        37: "山东",
        41: "河南",
        42: "湖北 ",
        43: "湖南",
        44: "广东",
        45: "广西",
        46: "海南",
        50: "重庆",
        51: "四川",
        52: "贵州",
        53: "云南",
        54: "西藏 ",
        61: "陕西",
        62: "甘肃",
        63: "青海",
        64: "宁夏",
        65: "新疆",
        71: "台湾",
        81: "香港",
        82: "澳门",
        91: "国外 "
    };
    var tip = "";
    var pass = true;

    if (!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
        tip = "身份证号格式错误";
        pass = false;
    } else if (!city[code.substr(0, 2)]) {
        tip = "地址编码错误";
        pass = false;
    } else {
        //18位身份证需要验证最后一位校验位
        if (code.length == 18) {
            code = code.split('');
            //∑(ai×Wi)(mod 11)
            //加权因子
            var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            //校验位
            var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
            var sum = 0;
            var ai = 0;
            var wi = 0;
            for (var i = 0; i < 17; i++) {
                ai = code[i];
                wi = factor[i];
                sum += ai * wi;
            }
            var last = parity[sum % 11];
            if (parity[sum % 11] != code[17]) {
                tip = "校验位错误";
                pass = false;
            }
        }
    }
    return tip || pass;
};
/*
目前，我国使用的手机号码为11位，其中各段有不同的编码方向：前3位———网络识别号；第4-7位———地区编码；第8-11位———用户号码。

--------------------------

#13,158,159开头
/^(?:13\d|15[89])-?\d{5}(\d{3}|\*{3})$/


#13,14,15,18开头
/^(?:13\d|14|15|18)-?\d{5}(\d{3}|\*{3})$/

电话和手机号码格式验证：（021-xxxx, 139xx）
regex: /(^[0-9]{3,4}\-[0-9]{7,8}$)|(^[0-9]{7,8}$)|(^\([0-9]{3,4}\)[0-9]{3,8}$)|(^0{0,1}13[0-9]{9}$)/

手机号验证：
13,158, 159
/^(?:13\d|15[89])-?\d{5}(\d{3}|\*{3})$/

13,15,18
/^1[3|5|8][0-9]\d{4,8}$/

---------------------------------------------

js正则验证输入是否为手机号码或电话号码

首先给出原文链接：http://www.cnblogs.com/cxy521/archive/2008/06/05/1214624.html

 
验证手机号码正则表达式：/^(?:13\d|15[89])-?\d{5}(\d{3}|\*{3})$/

验证电话号码正则表达式：/^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$/
*/
var phone_pattern_reg = /(^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$)|(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)/;
/*
邮箱验证，来自sina-weibo的脚本
http://js.t.sinajs.cn/t5/register/js/page/register/email.js?version=3c1867588e99a11e
*/
var isEmail = function(a) {
    if (!/^[0-9A-z_][_.0-9A-z-]{0,31}@([0-9A-z][0-9A-z-]{0,30}\.){1,4}[A-z]{2,4}$/.test(a)) return !1;
    if (a && a != "" && a.indexOf("@") != -1) {
        var b = a.indexOf("@"),
            c = a.substring(0, b);
        return c.length > 64 || a.length > 256 ? !1 : !0
    }
    return !1
}

var searchWeight = function(str, key) {
    str = str.toLowerCase();
    key = key.toLowerCase();
    if (str.indexOf(key) !== -1) {
        return str.split(key).length * 10;
    } else {
        var result = 0;
        for (var i = 0, c; c = key[i]; i += 1) {
            if (" ！@#￥%…&*（）{}：“《》。，’‘”；【】？\<\>\/\[\]\:\"\;\'\,\.\?\!\$\^".indexOf(c) === -1) {
                result += str.split(c).length - 1;
            }
        }
        return result;
    }
};
/*MD5*/
var crypto = require("crypto");

function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
};
//通用密码的加密算法，基于MD5
function _build_2_md5(pwd_str) {
    //固定字符串
    var _key = "Gaubee";
    //初次不可逆加密
    var md5Hax = md5(pwd_str);
    //双倍长度混合固定字符串再次加密，MD5暴力破解库与密码无法对应
    md5Hax = md5(md5Hax + md5Hax + _key);
    //最后一次加密，双倍MD5长度，64位，不知道算法细节的人完全无法使用正常MD5库进行暴力破解
    var result = md5Hax + md5(md5Hax + pwd_str);
    return result;
};
//不重复的ID
var _base_time_id = +new Date("2015-1-1");

function uuid(prefix) {
    return (prefix || "") + Math.random().toString(36).substr(2) + (new Date - _base_time_id).toString(36)
};

//Description:  银行卡号Luhm校验

//Luhm校验规则：16位银行卡号（19位通用）:

// 1.将未带校验位的 15（或18）位卡号从右依次编号 1 到 15（18），位于奇数位号上的数字乘以 2。
// 2.将奇位乘积的个十位全部相加，再加上所有偶数位上的数字。
// 3.将加法和加上校验位能被 10 整除。
function luhmCheck(bankno) {
    var lastNum = bankno.substr(bankno.length - 1, 1); //取出最后一位（与luhm进行比较）

    var first15Num = bankno.substr(0, bankno.length - 1); //前15或18位
    var newArr = new Array();
    for (var i = first15Num.length - 1; i > -1; i--) { //前15或18位倒序存进数组
        newArr.push(first15Num.substr(i, 1));
    }
    var arrJiShu = new Array(); //奇数位*2的积 <9
    var arrJiShu2 = new Array(); //奇数位*2的积 >9

    var arrOuShu = new Array(); //偶数位数组
    for (var j = 0; j < newArr.length; j++) {
        if ((j + 1) % 2 == 1) { //奇数位
            if (parseInt(newArr[j]) * 2 < 9)
                arrJiShu.push(parseInt(newArr[j]) * 2);
            else
                arrJiShu2.push(parseInt(newArr[j]) * 2);
        } else //偶数位
            arrOuShu.push(newArr[j]);
    }

    var jishu_child1 = new Array(); //奇数位*2 >9 的分割之后的数组个位数
    var jishu_child2 = new Array(); //奇数位*2 >9 的分割之后的数组十位数
    for (var h = 0; h < arrJiShu2.length; h++) {
        jishu_child1.push(parseInt(arrJiShu2[h]) % 10);
        jishu_child2.push(parseInt(arrJiShu2[h]) / 10);
    }

    var sumJiShu = 0; //奇数位*2 < 9 的数组之和
    var sumOuShu = 0; //偶数位数组之和
    var sumJiShuChild1 = 0; //奇数位*2 >9 的分割之后的数组个位数之和
    var sumJiShuChild2 = 0; //奇数位*2 >9 的分割之后的数组十位数之和
    var sumTotal = 0;
    for (var m = 0; m < arrJiShu.length; m++) {
        sumJiShu = sumJiShu + parseInt(arrJiShu[m]);
    }

    for (var n = 0; n < arrOuShu.length; n++) {
        sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
    }

    for (var p = 0; p < jishu_child1.length; p++) {
        sumJiShuChild1 = sumJiShuChild1 + parseInt(jishu_child1[p]);
        sumJiShuChild2 = sumJiShuChild2 + parseInt(jishu_child2[p]);
    }
    //计算总和
    sumTotal = parseInt(sumJiShu) + parseInt(sumOuShu) + parseInt(sumJiShuChild1) + parseInt(sumJiShuChild2);

    //计算Luhm值
    var k = parseInt(sumTotal) % 10 == 0 ? 10 : parseInt(sumTotal) % 10;
    var luhm = 10 - k;

    if (lastNum == luhm) {
        return true;
    } else {
        return false;
    }
};

var Tools = {
    name: function(name, type) {
        type || (type = "名字");
        if (name.replace(/[a-z0-9\.\-\_]/ig, "") !== "") {
            throw type + "中不可出现：字母、数字、点、减号、下划线以外的字符";;
        }
        if (/(\.|\-|\_)/.test(name[0])) {
            throw type + "中 点、减号、下划线不可作为第一个字符出现";
        }
        if (/(\.|\-|\_){2,}/.test(name)) {
            throw type + "中 点、减号、下划线不可连续出现";
        }
        return name.length < 12;
    },
    folder_name: function(name) {
        return folder_name_reg.test(name);
    },
    id_card: IdentityCodeValid,
    phone: function(phone_number) {
        return phone_pattern_reg.test(phone_number);
    },
    bank_card: luhmCheck,
    isEmail: isEmail,
    search: searchWeight,
    boolean_parse: function(boolean_str) {
        if (boolean_str && boolean_str === "false") {
            boolean_str = false;
        } else if (boolean_str) {
            boolean_str = true;
        } else {
            boolean_str = false;
        }
        return boolean_str;
    },
    isUrl: function(url) {
        return tld.isValid(url);
    },
    md5_2: _build_2_md5,
    md5: md5,
    uuid: uuid,
    isMobile: function(userAgent) {
        userAgent = userAgent.toLowerCase();
        var mobileAgent = ["nokia", "iphone", "android", "motorola", "^mot-", "softbank", "foma", "docomo", "kddi", "up.browser", "up.link", "htc", "dopod", "blazer", "netfront", "helio", "hosin", "huawei", "novarra", "CoolPad", "webos", "techfaith", "palmsource", "blackberry", "alcatel", "amoi", "ktouch", "nexian", "samsung", "^sam-", "s[cg]h", "^lge", "ericsson", "philips", "sagem", "wellcom", "bunjalloo", "maui", "symbian", "smartphone", "midp", "wap", "phone", "windows ce", "iemobile", "^spice", "^bird", "^zte-", "longcos", "pantech", "gionee", "^sie-", "portalmmm", "jigs browser", "hiptop", "^benq", "haier", "^lct", "operas*mobi", "opera*mini", "mobile", "blackberry", "IEMobile", "Windows Phone", "webos", "incognito", "webmate", "bada", "nokia", "lg", "ucweb", "skyfire", "ucbrowser"];
        var isMobile = false;
        for (var i = 0; i < mobileAgent.length; i++) {
            if (userAgent.indexOf(mobileAgent[i]) != -1) {
                isMobile = true;
                break;
            }
        }
        return isMobile;
    },
    isWeiXin: function(userAgent) {
        return (/MicroMessenger/i).test(userAgent);
    }
};

Tools.noop = noop;
Tools.Task = Task;
Tools.When = When;
Tools.F繁体_to_J简体 = _F繁体_to_J简体;

function noop() {};
//并发运行的任务限制
function Task(task_core, max_concurrent) {
    var self = this;
    if (!(self instanceof Task)) {
        return new Task(task_core, max_concurrent);
    }
    self.core = task_core;
    self.max_concurrent = +max_concurrent || 1;
    self.current_concurrent_num = 0;
    self.args_cache = [];
    self.run = function() {
        if (arguments.length) {
            self.args_cache.push(arguments);
        }
        if (self.args_cache.length && self.current_concurrent_num < self.max_concurrent) {
            self.current_concurrent_num += 1;
            self.core.apply(null, self.args_cache.shift())
        }
    };
    self.end = function() {
        self.current_concurrent_num -= 1;
        self.run(); //调用下一个任务来执行
    };
    self.re_run = function() {
        //不经过任务调度，直接在当前任务中重新执行
        self.core.apply(null, arguments);
    };
    return self;
};

// var t = Task(function(v, i) {
//  setTimeout(function() {
//      console.log(i);
//      t.end();
//  }, 1000);
// }, 2);
// Array.from({
//  length: 10
// }).forEach(t.run);


function When(task_num, complete_cb) {
    var self = this;
    if (!(self instanceof When)) {
        return new When(task_num, complete_cb);
    }
    //创建一个密集数组
    self.task_num = Array.from({
        length: task_num
    });
    //所有子任务完成后的回调
    self.complete_cb = complete_cb instanceof Function ? complete_cb : noop;
    self.complete_args = [];
};
When.prototype.ok = function(task_id, arg) {
    delete this.task_num[task_id];
    this.complete_args[task_id] = arg;
    if (this.is_complete()) {
        this.complete_cb(this.complete_args);
    }
};
When.prototype.is_complete = function() {
    var _is_complete = true;
    //使用洗漱数组无法被遍历的特性，如果所有任务都被delete了，说明整个任务数组就是一个洗漱数组，some是无法遍历到任何对象的
    this.task_num.some(function() {
        _is_complete = false; //如果还有元素对象，则还没结束
        return true; //只执行一次
    });
    return _is_complete;
};
When.prototype.then = function(cb) {
    if (this.is_complete()) {
        cb(this.complete_args);
    } else {
        if (this.complete_cb === noop) {
            this.complete_cb = cb;
        } else {
            var before = this.complete_cb;
            this.complete_cb = function() {
                before.apply(this, arguments);
                cb.apply(this, arguments);
            }
        }
    }
};


// w = When(10, function() {
//  console.log("all task run completed!");
//  w.then(function() {
//      console.log("all ok1")
//  });
// });
// w.then(function() {
//  console.log("all ok2")
// });
// var t = Task(function(v, i) {
//  setTimeout(function() {
//      console.log(i, "is ok");
//      w.ok(i)
//      t.end();
//  }, 200);
// }, 2);
// Array.from({
//  length: 10
// }).forEach(t.run);


// 繁体转简体
var _J简体 = '皑蔼碍爱翱袄奥坝罢摆败颁办绊帮绑镑谤剥饱宝报鲍辈贝钡狈备惫绷笔毕毙闭边编贬变辩辫鳖瘪濒滨宾摈饼拨钵铂驳卜补参蚕残惭惨灿苍舱仓沧厕侧册测层诧搀掺蝉馋谗缠铲产阐颤场尝长偿肠厂畅钞车彻尘陈衬撑称惩诚骋痴迟驰耻齿炽冲虫宠畴踌筹绸丑橱厨锄雏础储触处传疮闯创锤纯绰辞词赐聪葱囱从丛凑窜错达带贷担单郸掸胆惮诞弹当挡党荡档捣岛祷导盗灯邓敌涤递缔点垫电淀钓调迭谍叠钉顶锭订东动栋冻斗犊独读赌镀锻断缎兑队对吨顿钝夺鹅额讹恶饿儿尔饵贰发罚阀珐矾钒烦范贩饭访纺飞废费纷坟奋愤粪丰枫锋风疯冯缝讽凤肤辐抚辅赋复负讣妇缚该钙盖干赶秆赣冈刚钢纲岗皋镐搁鸽阁铬个给龚宫巩贡钩沟构购够蛊顾剐关观馆惯贯广规硅归龟闺轨诡柜贵刽辊滚锅国过骇韩汉阂鹤贺横轰鸿红后壶护沪户哗华画划话怀坏欢环还缓换唤痪焕涣黄谎挥辉毁贿秽会烩汇讳诲绘荤浑伙获货祸击机积饥讥鸡绩缉极辑级挤几蓟剂济计记际继纪夹荚颊贾钾价驾歼监坚笺间艰缄茧检碱硷拣捡简俭减荐槛鉴践贱见键舰剑饯渐溅涧浆蒋桨奖讲酱胶浇骄娇搅铰矫侥脚饺缴绞轿较秸阶节茎惊经颈静镜径痉竞净纠厩旧驹举据锯惧剧鹃绢杰洁结诫届紧锦仅谨进晋烬尽劲荆觉决诀绝钧军骏开凯颗壳课垦恳抠库裤夸块侩宽矿旷况亏岿窥馈溃扩阔蜡腊莱来赖蓝栏拦篮阑兰澜谰揽览懒缆烂滥捞劳涝乐镭垒类泪篱离里鲤礼丽厉励砾历沥隶俩联莲连镰怜涟帘敛脸链恋炼练粮凉两辆谅疗辽镣猎临邻鳞凛赁龄铃凌灵岭领馏刘龙聋咙笼垄拢陇楼娄搂篓芦卢颅庐炉掳卤虏鲁赂禄录陆驴吕铝侣屡缕虑滤绿峦挛孪滦乱抡轮伦仑沦纶论萝罗逻锣箩骡骆络妈玛码蚂马骂吗买麦卖迈脉瞒馒蛮满谩猫锚铆贸么霉没镁门闷们锰梦谜弥觅绵缅庙灭悯闽鸣铭谬谋亩钠纳难挠脑恼闹馁腻撵捻酿鸟聂啮镊镍柠狞宁拧泞钮纽脓浓农疟诺欧鸥殴呕沤盘庞国爱赔喷鹏骗飘频贫苹凭评泼颇扑铺朴谱脐齐骑岂启气弃讫牵扦钎铅迁签谦钱钳潜浅谴堑枪呛墙蔷强抢锹桥乔侨翘窍窃钦亲轻氢倾顷请庆琼穷趋区躯驱龋颧权劝却鹊让饶扰绕热韧认纫荣绒软锐闰润洒萨鳃赛伞丧骚扫涩杀纱筛晒闪陕赡缮伤赏烧绍赊摄慑设绅审婶肾渗声绳胜圣师狮湿诗尸时蚀实识驶势释饰视试寿兽枢输书赎属术树竖数帅双谁税顺说硕烁丝饲耸怂颂讼诵擞苏诉肃虽绥岁孙损笋缩琐锁獭挞抬摊贪瘫滩坛谭谈叹汤烫涛绦腾誊锑题体屉条贴铁厅听烃铜统头图涂团颓蜕脱鸵驮驼椭洼袜弯湾顽万网韦违围为潍维苇伟伪纬谓卫温闻纹稳问瓮挝蜗涡窝呜钨乌诬无芜吴坞雾务误锡牺袭习铣戏细虾辖峡侠狭厦锨鲜纤咸贤衔闲显险现献县馅羡宪线厢镶乡详响项萧销晓啸蝎协挟携胁谐写泻谢锌衅兴汹锈绣虚嘘须许绪续轩悬选癣绚学勋询寻驯训讯逊压鸦鸭哑亚讶阉烟盐严颜阎艳厌砚彦谚验鸯杨扬疡阳痒养样瑶摇尧遥窑谣药爷页业叶医铱颐遗仪彝蚁艺亿忆义诣议谊译异绎荫阴银饮樱婴鹰应缨莹萤营荧蝇颖哟拥佣痈踊咏涌优忧邮铀犹游诱舆鱼渔娱与屿语吁御狱誉预驭鸳渊辕园员圆缘远愿约跃钥岳粤悦阅云郧匀陨运蕴酝晕韵杂灾载攒暂赞赃脏凿枣灶责择则泽贼赠扎札轧铡闸诈斋债毡盏斩辗崭栈战绽张涨帐账胀赵蛰辙锗这贞针侦诊镇阵挣睁狰帧郑证织职执纸挚掷帜质钟终种肿众诌轴皱昼骤猪诸诛烛瞩嘱贮铸筑驻专砖转赚桩庄装妆壮状锥赘坠缀谆浊兹资渍踪综总纵邹诅组钻致钟么为只凶准启板里雳余链泄'
    .split("");
var _F繁体 = '皚藹礙愛翺襖奧壩罷擺敗頒辦絆幫綁鎊謗剝飽寶報鮑輩貝鋇狽備憊繃筆畢斃閉邊編貶變辯辮鼈癟瀕濱賓擯餅撥缽鉑駁蔔補參蠶殘慚慘燦蒼艙倉滄廁側冊測層詫攙摻蟬饞讒纏鏟産闡顫場嘗長償腸廠暢鈔車徹塵陳襯撐稱懲誠騁癡遲馳恥齒熾沖蟲寵疇躊籌綢醜櫥廚鋤雛礎儲觸處傳瘡闖創錘純綽辭詞賜聰蔥囪從叢湊竄錯達帶貸擔單鄲撣膽憚誕彈當擋黨蕩檔搗島禱導盜燈鄧敵滌遞締點墊電澱釣調叠諜疊釘頂錠訂東動棟凍鬥犢獨讀賭鍍鍛斷緞兌隊對噸頓鈍奪鵝額訛惡餓兒爾餌貳發罰閥琺礬釩煩範販飯訪紡飛廢費紛墳奮憤糞豐楓鋒風瘋馮縫諷鳳膚輻撫輔賦複負訃婦縛該鈣蓋幹趕稈贛岡剛鋼綱崗臯鎬擱鴿閣鉻個給龔宮鞏貢鈎溝構購夠蠱顧剮關觀館慣貫廣規矽歸龜閨軌詭櫃貴劊輥滾鍋國過駭韓漢閡鶴賀橫轟鴻紅後壺護滬戶嘩華畫劃話懷壞歡環還緩換喚瘓煥渙黃謊揮輝毀賄穢會燴彙諱誨繪葷渾夥獲貨禍擊機積饑譏雞績緝極輯級擠幾薊劑濟計記際繼紀夾莢頰賈鉀價駕殲監堅箋間艱緘繭檢堿鹼揀撿簡儉減薦檻鑒踐賤見鍵艦劍餞漸濺澗漿蔣槳獎講醬膠澆驕嬌攪鉸矯僥腳餃繳絞轎較稭階節莖驚經頸靜鏡徑痙競淨糾廄舊駒舉據鋸懼劇鵑絹傑潔結誡屆緊錦僅謹進晉燼盡勁荊覺決訣絕鈞軍駿開凱顆殼課墾懇摳庫褲誇塊儈寬礦曠況虧巋窺饋潰擴闊蠟臘萊來賴藍欄攔籃闌蘭瀾讕攬覽懶纜爛濫撈勞澇樂鐳壘類淚籬離裏鯉禮麗厲勵礫曆瀝隸倆聯蓮連鐮憐漣簾斂臉鏈戀煉練糧涼兩輛諒療遼鐐獵臨鄰鱗凜賃齡鈴淩靈嶺領餾劉龍聾嚨籠壟攏隴樓婁摟簍蘆盧顱廬爐擄鹵虜魯賂祿錄陸驢呂鋁侶屢縷慮濾綠巒攣孿灤亂掄輪倫侖淪綸論蘿羅邏鑼籮騾駱絡媽瑪碼螞馬罵嗎買麥賣邁脈瞞饅蠻滿謾貓錨鉚貿麽黴沒鎂門悶們錳夢謎彌覓綿緬廟滅憫閩鳴銘謬謀畝鈉納難撓腦惱鬧餒膩攆撚釀鳥聶齧鑷鎳檸獰甯擰濘鈕紐膿濃農瘧諾歐鷗毆嘔漚盤龐國愛賠噴鵬騙飄頻貧蘋憑評潑頗撲鋪樸譜臍齊騎豈啓氣棄訖牽扡釺鉛遷簽謙錢鉗潛淺譴塹槍嗆牆薔強搶鍬橋喬僑翹竅竊欽親輕氫傾頃請慶瓊窮趨區軀驅齲顴權勸卻鵲讓饒擾繞熱韌認紉榮絨軟銳閏潤灑薩鰓賽傘喪騷掃澀殺紗篩曬閃陝贍繕傷賞燒紹賒攝懾設紳審嬸腎滲聲繩勝聖師獅濕詩屍時蝕實識駛勢釋飾視試壽獸樞輸書贖屬術樹豎數帥雙誰稅順說碩爍絲飼聳慫頌訟誦擻蘇訴肅雖綏歲孫損筍縮瑣鎖獺撻擡攤貪癱灘壇譚談歎湯燙濤縧騰謄銻題體屜條貼鐵廳聽烴銅統頭圖塗團頹蛻脫鴕馱駝橢窪襪彎灣頑萬網韋違圍爲濰維葦偉僞緯謂衛溫聞紋穩問甕撾蝸渦窩嗚鎢烏誣無蕪吳塢霧務誤錫犧襲習銑戲細蝦轄峽俠狹廈鍁鮮纖鹹賢銜閑顯險現獻縣餡羨憲線廂鑲鄉詳響項蕭銷曉嘯蠍協挾攜脅諧寫瀉謝鋅釁興洶鏽繡虛噓須許緒續軒懸選癬絢學勳詢尋馴訓訊遜壓鴉鴨啞亞訝閹煙鹽嚴顔閻豔厭硯彥諺驗鴦楊揚瘍陽癢養樣瑤搖堯遙窯謠藥爺頁業葉醫銥頤遺儀彜蟻藝億憶義詣議誼譯異繹蔭陰銀飲櫻嬰鷹應纓瑩螢營熒蠅穎喲擁傭癰踴詠湧優憂郵鈾猶遊誘輿魚漁娛與嶼語籲禦獄譽預馭鴛淵轅園員圓緣遠願約躍鑰嶽粵悅閱雲鄖勻隕運蘊醞暈韻雜災載攢暫贊贓髒鑿棗竈責擇則澤賊贈紮劄軋鍘閘詐齋債氈盞斬輾嶄棧戰綻張漲帳賬脹趙蟄轍鍺這貞針偵診鎮陣掙睜猙幀鄭證織職執紙摯擲幟質鍾終種腫衆謅軸皺晝驟豬諸誅燭矚囑貯鑄築駐專磚轉賺樁莊裝妝壯狀錐贅墜綴諄濁茲資漬蹤綜總縱鄒詛組鑽緻鐘麼為隻兇準啟闆裡靂餘鍊洩'
    .split("");

var _F繁体_to_J简体_map = Object.create(null);
_F繁体.forEach(function(word, index) {
    _F繁体_to_J简体_map[word] = _J简体[index];
});

function _F繁体_to_J简体(str) {
    str = str.split("");
    for (var i = 0, len = str.length; i < len; i += 1) {
        var _word = str[i];
        var _j_word = _F繁体_to_J简体_map[_word];
        if (_j_word) {
            str[i] = _j_word;
        }
    }
    return str.join("")
};

module.exports = global.Tools = global.$$ = Tools;

/*test*/
// var md5_str = $$.md5("呵呵哈哈");
// console.log(md5_str = md5_str.substring(0, 6));
// console.log(parseInt(md5_str, 16));