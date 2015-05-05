var Port = require('../lib/port');

// console.time('list');
var port = new Port();
// var list = port.tcp();
// var list = port.listen();
var list = port.getPid(3001);
// console.timeEnd('list');
console.log(list);

// var r = port.getByPid(3278);
// console.log('r', r);

