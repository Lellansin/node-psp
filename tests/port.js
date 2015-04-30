var Port = require('../lib/port');

// console.time('list');
var port = new Port();
// var list = port.tcp();
var list = port.listen();
// console.timeEnd('list');
console.log(list);