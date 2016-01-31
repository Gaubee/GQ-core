require("./$.Array")
var fs = require('fs');
var path = require("path");

//复制目录
var copydir = (function() {
    var stat = fs.stat;
    /*
     * 复制目录中的所有文件包括子目录
     * @param{ String } 需要复制的目录
     * @param{ String } 复制到指定的目录
     */
    var copy = function(src, dst) {
        // 读取目录中的所有文件/目录
        fs.readdir(src, function(err, paths) {
            if (err) {
                throw err;
            }
            paths.forEach(function(path) {
                var _src = src + '/' + path,
                    _dst = dst + '/' + path,
                    readable, writable;
                stat(_src, function(err, st) {
                    if (err) {
                        throw err;
                    }
                    // 判断是否为文件
                    if (st.isFile()) {
                        // 创建读取流
                        readable = fs.createReadStream(_src);
                        // 创建写入流
                        writable = fs.createWriteStream(_dst);
                        // 通过管道来传输流
                        readable.pipe(writable);
                    }
                    // 如果是目录则递归调用自身
                    else if (st.isDirectory()) {
                        exists(_src, _dst, copy);
                    }
                });
            });
        });
    };
    // 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
    var exists = function(src, dst, callback) {
        if (fs.existsSync(dst)) {
            // 已存在
            callback(src, dst);
        } else {
            // 不存在
            fs.mkdir(dst, function() {
                callback(src, dst);
            });
        }
    };
    return function(s, d) {
        console.log(s, d);
        exists(s, d, copy);
    }
})();
// 递归创建目录
function mkdirSync(url, mode) {
    var arr = url.split(path.sep);
    mode = mode || 0755;
    if (arr[0] === "") {
        arr.shift();
        arr[0] = path.sep + arr[0];
    }
    if (arr[0] === ".") { //处理 ./aaa
        arr.shift();
    }
    if (arr[0] == "..") { //处理 ../ddd/d
        arr.splice(0, 2, arr[0] + path.sep + arr[1])
    }
    arr = arr.clearNull();

    function inner(cur) {
        console.log("cur:", cur);
        if (!fs.existsSync(cur)) { //不存在就创建一个
            fs.mkdirSync(cur, mode)
        }
        if (arr.length) {
            inner(cur + path.sep + arr.shift());
        }
    }
    arr.length && inner(arr.shift());
};
//递归删除目录
var rmdirSync = (function() {
    function iterator(url, dirs) {
        var stat = fs.statSync(url);
        if (stat.isDirectory()) {
            dirs.unshift(url); //收集目录
            inner(url, dirs);
        } else if (stat.isFile()) {
            fs.unlinkSync(url); //直接删除文件
        }
    }

    function inner(path, dirs) {
        var arr = fs.readdirSync(path);
        for (var i = 0, el; el = arr[i++];) {
            iterator(path + path.sep + el, dirs);
        }
    }
    return function(dir, cb) {
        cb = cb || function() {};
        var dirs = [];

        try {
            iterator(dir, dirs);
            for (var i = 0, el; el = dirs[i++];) {
                fs.rmdirSync(el); //一次性删除所有收集到的目录
            }
            cb()
        } catch (e) { //如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})();
//活取指定目录下的所有文件，包括子目录的文件
function getAllFiles(root) {
    var result = [],
        files = fs.readdirSync(root)
    files.forEach(function(file) {
        var pathname = root + path.sep + file,
            stat = fs.lstatSync(pathname)
        if (stat === undefined) return

        // 不是文件夹就是文件
        if (!stat.isDirectory()) {
            result.push(pathname)
                // 递归自身
        } else {
            result = result.concat(getAllFiles(pathname))
        }
    });
    return result
};
//创建不存在的文件
function mkfileSync(file_path, content) {
    try {
        fs.readFileSync(file_path);
    } catch (e) {
        // file_path = __dirname+file_path;
        var folder_path = file_path.split(path.sep);
        folder_path.pop();
        folder_path = folder_path.join(path.sep);
        fs.smartMkdirSync(folder_path);
        fs.writeFileSync(file_path, content || "");
    }
};
fs.copydir = copydir;
fs.smartMkdirSync = mkdirSync;
fs.smartRmdirSync = rmdirSync;
fs.smartMkfileSync = mkfileSync;
fs.lsAll = getAllFiles;
global.fs = fs;