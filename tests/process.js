var util = require('util');
var process = require('../lib/process')

// console.time('list');
// var list = process.list('node');
// console.log('list', list);
// console.timeEnd('list');

// console.time('active');
// var list = process.active('node');
// var pid = process.getParant('node');
// var list = process.active('Thunder');
// var list = process.getTreeByName('node', true);
var list = process.getByName('node');
// console.log(pid);
// console.log(list);
// console.timeEnd('active');

// process.kill(669)

// process.tree(369);

// console.log('r', util.inspect(r, 8, true));
// console.log(r[0].son[1].son[11]);