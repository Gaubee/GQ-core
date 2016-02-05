# TCP

## Base

### socket.msgInfo(type, extend_info)

发送`type`事件，并携带extend_info

### socket.onMsgInfo(type, cb)

监听`type`事件

### socket.msgSuccess(type, extend_info, successMsg)

发送`[type]:success`事件

### socket.onMsgSuccess(type)

监听`[type]:success`事件

### socket.msgError(type, extend_info, errorMsg)

发送`[type]:error`事件

### socket.onMsgError(type)

监听`[type]:error`事件

## 拓展阅读

[Extend:Router](./Extend-Router.md)
[Extend:Redis](./Extend-Redis.md)
[Extend:Component](./Extend-Component.md)