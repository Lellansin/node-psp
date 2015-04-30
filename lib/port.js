var sscanf = require('scanf').sscanf;
var exec = require('sync-exec');

var Port = module.exports = function() {
  this.init();
};

Port.prototype.init = function() {
  this.snapshot = lsof();
};

Port.prototype.list = function() {
  return this.snapshot.exec.stdout;
};

Port.prototype.tcp = function() {
  return lsof('tcp').exec.stdout;
};

Port.prototype.udp = function() {
  return lsof('udp').exec.stdout;
};

Port.prototype.grep = function(name) {
  return lsof('|grep ' + name).exec.stdout;
};

Port.prototype.listen = function() {
  var stdout = lsof('|grep LISTEN').exec.stdout;
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

Port.prototype.getList = function(flush) {
  var self = this;
  if (!self.list || flush) {
    self.list = getList(self.snapshot.exec.stdout);
  }
  return self.list;
};

var lsof = function(args) {
  // console.time('cmd');
  var cmd = 'lsof -i ' + (args || '');
  var info = exec(cmd);
  // console.timeEnd('cmd');

  return {
    exec: info
  };
};

var getList = function(output) {
  var format = '%s %s %s %s %s %s %s %s %s (%s)';
  var list = [];

  eachLine(output, function(str, line) {
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