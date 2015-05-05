var color = require('tinycolor');
var scanf = require('scanf');
var Port = require('./port');
var Process = require('./process');

function pp() {

}

var while_list = ['port', 'id', 'env', 'http'];

var inWhile = function(str) {
	for (var i = 0; i < while_list.length; i++) {
		if (str.toLowerCase().indexOf(while_list[i]) >= 0) {
			return true;
		}
	}
	return false;
};

pp.prototype.portList = function() {
	var port = new Port();
	var text = port.listen();
	console.log(text);
};

pp.prototype.portTree = function() {
	var arg = arguments[0];
	if (arg.constructor == Number) {
		var port = new Port();
		var pid = port.getPid(arg);
		var parent = arguments[1];
		if (!!parent) {
			pid = Process.getPPid(pid);
		}
		Process.tree(pid, false, showPortTree);
	} else if (arg.constructor == String) {
		Process.getTreeByName(arg, false, showPortTree);
	}
};

pp.prototype.killByPort = function(num, force) {
	var port = new Port();
	var pid = port.getPid(num);
	var ps = Process.get(pid);

	if (!force && !killConfirm(ps)) {
		return;
	}

	return Process.kill(pid);
};

pp.prototype.kill = function() {
	var arg = arguments[0],
		force = arguments[1];

	if (typeof arg == 'number') {
		var ps = Process.get(arg);


		if (!force && !killConfirm(ps))
			return;

		return Process.kill(pid);

	} else if (typeof arg == 'string') {
		var list = Process.getByName(arg)
		var result = [];

		for (var i = 0; i < list.length; i++) {
			var ps = list[i]

			if (!force && !killConfirm(ps)) {
				continue;
			}

			result.push(Process.kill(pid));
		}

		return result;
	}
};

var help = function() {
	console.log('Usage cmd    show process command and args');
	console.log('      port   show process open port');
	console.log('      value  show process infomation');
	console.log('      y      yes to kill this process');
	console.log('      enter  pass this process');
	console.log('      help   help info');
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
				break;
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

pp.prototype.psTree = function() {
	var arg = arguments[0];
	if (typeof arg == 'number') {
		Process.tree(arg);
	} else if (typeof arg == 'string') {
		Process.getTreeByName(arg);
	}
};

var showPortTree = function(pre, ps) {
	var port = new Port();

	var ports = port.getByPid(ps.pid);
	var str = pre.replace(/[\s\S]/g, ' ');
	if (ports.length) {
		console.log(str, 'Port', ports.sort().join(', '));
	}

	var list = ps.cmd.split(' ');
	if (list.length < 2) {
		return;
	}
	for (var i = 1; i < list.length; i++) {
		var prama = list[i];
		if (inWhile(prama)) {
			if (prama.indexOf('id') >= 0) {
				prama = prama.yellow;
			}
			console.log(str + '    ' + prama);
		}
	}
};

module.exports = pp;