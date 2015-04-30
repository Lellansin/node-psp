var process = module.exports;
var sscanf = require('scanf').sscanf;
var exec = require('sync-exec');

process.list = function() {
  return ps().exec.stdout;
};

process.grep = function(name) {
  return ps('|grep ' + name).list;
};

process.active = function(name) {
  var list = ps('|grep ' + name).list;
  var result = '';
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (item.cmd.indexOf(name) >= 0) {
      result += item.__line__ + '\n';
    }
  }
  return result;
};

var ps = function(args) {
  var cmd = 'ps -ef ' + (args || '');
  var exe = exec(cmd);
  var format = '%d %d %d %d %s %s %s %S';
  var list = [];

  eachLine(exe.stdout, function(str, line) {
    var ps = sscanf(str, format, 'uid', 'pid', 'ppid', 'c', 'stime', 'tty', 'time', 'cmd');
    ps.__line__ = str;
    list.push(ps);
  });

  return {
    exec: exe,
    list: list
  };
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