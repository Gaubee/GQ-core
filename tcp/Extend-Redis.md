## Extend:Redis

### socket.redisExec(handle, args)

执行Redis数据库命令，配合co库使用：
```js
var test_key = yield socket.redisExec("get", ["test_key"])
```
