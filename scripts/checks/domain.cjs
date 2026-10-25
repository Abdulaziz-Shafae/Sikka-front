// Exercise actual scheduling boundaries and route connectivity; no browser required.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/sikka-data.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
const read = name => name.endsWith('.json') ? JSON.parse(fs.readFileSync(path.join(root, 'lib', name), 'utf8')) : require(name);
new Function('require', 'module', 'exports', code)(read, loaded, loaded.exports);
const { makeActivities, findRoute, initialVisit, rides } = loaded.exports;
let cases = 0;
for (const duration of [120, 180, 240, 300, 360, 480]) {
  for (const meal of ['بدون بريك', 'وجبة', 'سناك', 'وجبة وسناك', 'نقررها بعدين']) {
    for (const count of [0, 1, 3, 32]) {
      const tasks = makeActivities({ ...initialVisit, duration, meal, selected: rides.slice(0, count).map(r => r.slug) });
      tasks.forEach((task, i) => {
        if (task.offset + task.minutes > duration) throw Error('Activity exceeds visit duration');
        if (i && task.offset < tasks[i-1].offset + tasks[i-1].minutes) throw Error('Activities overlap');
        if (!task.participants.length) throw Error('Activity has no participants');
      });
      cases++;
    }
  }
}
for (const ride of rides) {
  const route = findRoute(ride.slug, 'gearworks-eatery');
  if (!route || route.meters < 0 || !route.paths.length) throw Error('Disconnected route: ' + ride.slug);
}
const graph = JSON.parse(fs.readFileSync(path.join(root, 'lib/park-routes.json'), 'utf8'));
const facilities = graph.places.filter(p => p.kind === 'PRAYER_ROOM' || p.kind === 'RESTROOM');
for (const facility of facilities) {
  const outbound = findRoute('iron-rattler', facility.sourcePlaceId);
  const inbound = findRoute(facility.sourcePlaceId, 'iron-rattler');
  if (!outbound || !inbound || outbound.meters !== inbound.meters) throw Error('Facility route missing or asymmetric: ' + facility.sourcePlaceId);
}
console.log(`Passed ${cases} schedule cases, ${rides.length} ride routes, and ${facilities.length} facility routes in both directions.`);
