var sscanf = require('scanf').sscanf;
var exec = require('sync-exec');

var Port = module.exports = function() {};

Port.prototype.getPid = function(port) {
  var res = this.num(port.toString());
  var list = getList(res);
  var establish = [];

  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (item.status == 'LISTEN') {
      return item.pid;
    } else if (item.status == 'ESTABLISHED') {
      establish.push(item);
    }
  }

  if (!establish.length) {
    return null;
  }

  return establish;
};

Port.prototype.getByPid = function(pid) {
  var text = lsof('tcp | grep LISTEN | grep ' + pid).stdout;
  var list = getList(text);
  var ports = [];

  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    ports.push(item.name.split(':').pop());
  }
  return ports;
};

Port.prototype.tcp = function() {
  return lsof('tcp').stdout;
};

Port.prototype.udp = function() {
  return lsof('udp').stdout;
};

/*
 * get port by port num
 */
Port.prototype.num = function(num) {
  return lsof('tcp:' + num).stdout;
};

Port.prototype.grep = function(name) {
  return lsof('|grep ' + name).stdout;
};

Port.prototype.listen = function() {
  var stdout = lsof('|grep LISTEN').stdout;
  this.listen = getList(stdout);
  return stdout;
};

Port.prototype.established = function(name) {
  var list = lsof('|grep ESTABLISHED');
  var result = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (item.cmd.indexOf(name) >= 0) {
      result.push(item);
    }
  }
  return result;
};

var lsof = function(args) {
  var cmd = 'lsof -P -i ' + (args || '');
  try {
    return exec(cmd);
  } catch (e) {
    return {
      stdout: '',
      stderr: e.message
    };
  }
};

var getList = function(output) {
  var format = '%s %d %s %s %s %s %s %s %s (%s)';
  var list = [];

  eachLine(output, function(str) {
    var info = sscanf(str, format,
      'command', 'pid', 'user', 'fd', 'type', 'device',
      'size/off', 'node', 'name', 'status');

    list.push(info);
  });

  return list;
};

var eachLine = function(content, cb) {
  var pre = 0;
  var line = 0;
  for (var i = 0; i < content.length; i++) {
    var c = content[i];
    if (c == '\n') {
      cb(content.substring(pre, i), line++);
      pre = i + 1;
    }
  }
  return;
};