var process = require('../lib/process')

// console.time('list');
// var list = process.list('node');
// console.log('list', list);
// console.timeEnd('list');

// console.time('active');
var list = process.active('node');
// var list = process.active('Thunder');
console.log(list);
// console.timeEnd('active');