const { spawn } = require('node:child_process');
const path = require('node:path');
const local = process.argv[2] === 'local';
const remote = 'https://pch.alektasolutions.com/connector/api/v1';
const env = { ...process.env,
  PCH_API_URL: local ? 'http://localhost:3003/api/v1' : remote,
  PCH_ORDERS_API_URL: local ? 'http://localhost:3002/api/v1' : remote
};
console.log(local ? 'Using local PCH services (merchant 3003, orders 3002)' : 'Using deployed PCH services');
const child = spawn(process.execPath, [path.resolve(__dirname, '../node_modules/@angular/cli/bin/ng.js'), 'serve', '--host=localhost', '--port=8100', ...process.argv.slice(3)], { stdio: 'inherit', env });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code === null ? 1 : code; });
