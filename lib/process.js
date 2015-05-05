var color = require('tinycolor');
var underscore = require('underscore');
var process = module.exports;
var sscanf = require('scanf').sscanf;
var exec = require('sync-exec');

process.list = function() {
  return ps().stdout;
};

process.tree = function(pid, flag, cb) {
  var text = ps().stdout;
  var json = getRelation(text);
  var index = json.index[pid || 1];

  if (!index) {
    return null;
  }

  var obj = getByListKey(json, index);

  if (!flag) {
    listTree(obj, ' ', '', cb);
  }

  return obj;
};

process.kill = function(pid) {
  var cmd = 'kill -9 ' + pid;
  // console.log('cmd', cmd);
  return exec(cmd);
};

process.getTreeByName = function(name, flag, cb) {
  var text = ps('|grep ' + name).stdout;
  var json = getRelation(text);
  var result = [];

  for (var key in json) {
    if (parseInt(key) >= 0) {
      if (!flag) {
        listTree(json[key].son, ' ', '', cb);
      }
      result.push(json[key].son);
    }
  }

  return result;
};

process.getPPid = function(pid) {
  var text = ps('|grep ' + pid).stdout;
  var list = getList(text);
  return getInfo(list, pid).ppid;
};

process.get = function(pid) {
  var text = ps('|grep ' + pid).stdout;
  var list = getList(text);
  return getInfo(list, pid);
};

process.getByName = function(name) {
  var text = ps('|grep ' + name).stdout;
  var list = getList(text);
  return getInfos(list, name);
};

process.grep = function(name) {
  return ps('|grep ' + name).list;
};

process.active = function(name) {
  var stdout = ps('|grep ' + name).stdout;
  // var list = getList(stdout);
  // var result = '';
  // for (var i = 0; i < list.length; i++) {
  //   var item = list[i];
  //   if (item.cmd.indexOf(name) >= 0) {
  //     result += item.__line__ + '\n';
  //   }
  // }
  return stdout;
};

var ps = function(args) {
  var cmd = 'ps -ef ' + (args || '');
  // console.log('cmd', cmd);
  return exec(cmd);
};

var getMiddle = function(len) {
  return function(count, flag) {
    var str = '─ ';
    if (flag) {
      str = '┬ ';
    }
    if (count == 1) {
      return '└─' + str;
    } else {
      return '├─' + str;
    }
  };
};

var getExe = function(cmd) {
  var result = '';
  if (cmd) {
    result = cmd.split(' ')[0];
  }
  return result.green;
};

var listTree = function(obj, indentation, start, cb) {
  var indent = (indentation || (indentation = '')) + (start ? start : '');
  if (obj.constructor != Object && obj.constructor != Array) {
    return;
  }

  var outputTree = function(pre, ps, cb) {
    console.log(pre + ps.pid.toString().blue + ' ' + getExe(ps.cmd));

    cb && cb.apply(null, arguments);
  };

  if (!!obj.son) {
    outputTree('─┬ ', obj, cb);
    return listTree(obj.son, indent, '', cb);
  }

  var length = underscore.size(obj),
    len = length;
  var getChar = getMiddle(len);
  if (obj.pid >= 0 && !obj.son) {
    return outputTree('── ', obj, cb);
  }

  for (var key in obj) {
    var ps = obj[key];
    var middle = getChar(len--, !!ps.son);
    outputTree(indent + middle, ps, cb);

    if (ps.son) {
      var str = '│ ';
      if (length == 1 || len === 0) {
        str = '  ';
      }
      listTree(ps.son, indent, str, cb);
    }
  }
};

var getByListKey = function(json, str) {
  var list = str.split('.');
  var obj = json;

  for (var i = 0; i < list.length; i++) {
    var key = list[i];
    if (obj[key]) {
      obj = obj[key];
    } else {
      return null;
    }
  }

  return obj;
};

var getRelation = function(text) {
  var format = '%d %d %d %d %s %s %s %S';
  var list = [];
  var relation = {
    index: {}
  };

  eachLine(text, function(str) {
    var ps = sscanf(str, format, 'uid', 'pid', 'ppid', 'c', 'stime', 'tty', 'time', 'cmd');
    list.push(ps);
  });

  list.sort(function(a, b) {
    return a.pid - b.pid;
  });

  underscore.each(list, function(ps) {
    if (!relation.index[ps.ppid]) {
      relation.index[ps.pid] = ps.ppid + '.son.' + ps.pid;
      relation[ps.ppid] = {
        son: {}
      };
      relation[ps.ppid].son[ps.pid] = ps;

    } else {
      var index = relation.index[ps.ppid];
      var parent = getByListKey(relation, index);
      if (!parent) {
        return;
      }
      if (!parent.son) {
        parent.son = {};
      }
      parent.son[ps.pid] = ps;
      relation.index[ps.pid] = relation.index[ps.ppid] + '.son.' + ps.pid;

    }
  });

  return relation;
};

var getInfo = function(list, pid) {
  for (var i = list.length - 1; i >= 0; i--) {
    var ps = list[i];
    if (ps.pid == pid) {
      return ps;
    }
  }
  return null;
};

var getInfos = function(list, name) {
  var result = [];
  for (var i = list.length - 1; i >= 0; i--) {
    var ps = list[i];
    if (ps.cmd.split(' ')[0].indexOf(name) >= 0) {
      result.push(ps)
    }
  }
  return result;
};

var getList = function(text) {
  var format = '%d %d %d %d %s %s %s %S';
  var list = [];

  eachLine(text, function(str) {
    var ps = sscanf(str, format, 'uid', 'pid', 'ppid', 'c', 'stime', 'tty', 'time', 'cmd');
    // ps.__line__ = str;
    list.push(ps);
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