var fs = require('fs');
var util = require('util');
var scanf = require('scanf');
var color = require('tinycolor');
var Port = require('./port');
var Process = require('./process');

var config_path = process.env.HOME + '/.pspconfig';

function psp() {

}

var white_list = [];

if (fs.existsSync(config_path)) {
  white_list = require(config_path).white_list || [];
}

var inWhile = function(str) {
  if (!white_list.length) {
    return false;
  }

  for (var i = 0; i < white_list.length; i++) {
    if (str.toLowerCase().indexOf(white_list[i]) >= 0) {
      return true;
    }
  }
  return false;
};

psp.prototype.portList = function() {
  var port = new Port();
  var text = port.listen();
  console.log(text);
};

psp.prototype.portTree = function(opts) {
  var arg = opts.arg;

  if (arg.constructor == Number) {
    var port = new Port();
    var pid = port.getPid(arg);
    if (!pid) {
      console.log('port not opened');
      return;
    }
    if (!!opts.show_parent) {
      pid = Process.getPPid(pid);
    }
    Process.tree(pid, false, showPsInfo(opts));
  } else if (arg.constructor == String) {
    Process.getTreeByName(arg, false, showPsInfo(opts));
  }
};

psp.prototype.killByPort = function(num, force) {
  var port = new Port();
  var pid = port.getPid(num);
  if (!pid) {
    console.log('port not opened');
    return;
  }
  var ps = Process.get(pid);

  if (!force && !killConfirm(ps)) {
    return;
  }

  return Process.kill(pid);
};

psp.prototype.kill = function() {
  var arg = arguments[0],
    force = arguments[1];

  if (typeof arg == 'number') {
    var ps = Process.get(arg);


    if (!force && !killConfirm(ps))
      return;

    return Process.kill(ps.pid);

  } else if (typeof arg == 'string') {
    var list = Process.getByName(arg);
    var result = [];

    for (var i = 0; i < list.length; i++) {
      var ps = list[i];

      if (!force && !killConfirm(ps)) {
        continue;
      }

      result.push(Process.kill(ps.pid));
    }

    return result;
  }
};

psp.prototype.configInit = function() {
  var list = [];
  console.log('Args white list:');
  do {
    process.stdout.write('> ');
    var str = scanf('%s');
    if (str) {
      list.push(str);
    }
    console.log('Add more? (y/n)');
  } while (scanf('%s') == 'y');
  console.log('White list is:', list, '(yes/no)');
  if (scanf('%s') == 'yes') {
    var data = {
      white_list: list
    };
    fs.writeFileSync(config_path, 'module.exports = ' + util.inspect(data));
  }
};

var help = function() {
  console.log('Usage cmd    show process command and args');
  console.log('      port   show process open port');
  console.log('      value  show process infomation');
  console.log('      y      yes to kill this process');
  console.log('      enter  pass this process');
  console.log('      help   show help info');
};

var killConfirm = function(ps) {
  console.log('Do you want to kill the process:(y/n, help)');
  console.log('pid [' + ps.pid.toString().blue + '] cmd [' + ps.cmd.split(' ')[0] + ']');
  var flag = true;
  do {
    process.stdout.write('> ');
    var answer = scanf('%s');

    if (!answer)
      break;

    switch (answer) {
      case 'y':
        return true;
      case 'v':
      case 'value':
        console.log(ps);
        break;
      case 'p':
      case 'port':
        var port = new Port();
        var ports = port.getByPid(ps.pid);
        if (ports.length) {
          console.log(ports.sort().join(', '));
        } else {
          console.log('no port open');
        }
        break;
      case 'args':
      case 'c':
      case 'cmd':
        console.log(ps.cmd.split(' '));
        break;
      case 'h':
      case 'help':
        help();
        break;
      default:
        flag = false;
    }
  } while (flag);

  console.log('pass');
  return false;
};

psp.prototype.psTree = function(opts) {
  var arg = opts.arg;
  if (typeof arg == 'number') {
    Process.tree(arg, false, showPsInfo(opts));
  } else if (typeof arg == 'string') {
    Process.getTreeByName(arg, false, showPsInfo(opts));
  }
};

var showPsInfo = function(opts) {

  return function(pre, ps) {
    var str = pre.replace(/[\s\S]/g, ' ');

    if (opts.show_port) {
      var port = new Port();

      var ports = port.getByPid(ps.pid);
      if (ports.length) {
        console.log(str, 'Port', ports.sort().join(', '));
      }
    }

    if (opts.white_flag) {
      var list = ps.cmd.split(' ');
      if (list.length < 2) {
        return;
      }
      for (var i = 1; i < list.length; i++) {
        var prama = list[i];
        if (inWhile(prama)) {
          if (prama.indexOf('id') >= 0) {
            prama = prama.yellow;
          } else {
            prama = prama.replace(/([\d]+)/, '$1'.magenta);
          }
          console.log(str + '    ' + prama);
        }
      }
    } else if (opts.show_arg) {
      var list = ps.cmd.split(' ');
      if (list.length < 2) {
        return;
      }
      for (var i = 1; i < list.length; i++) {
        var prama = list[i];
        console.log(str + '    ' + prama);
      }
    }
  };
};

module.exports = psp;
