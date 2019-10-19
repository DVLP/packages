import fs from 'fs';

const json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const oldVersion = json.version;
const ver = json.version.split('.');
ver[ver.length -1] = parseInt(ver[ver.length -1]) + 1;
const newVersion = ver.join('.');
console.log(oldVersion, newVersion);
json.version = newVersion;
if (json.cdn.indexOf(oldVersion) === -1) {
  throw new Error('CDN version out of sync');
}
json.cdn = json.cdn.replace(oldVersion, newVersion);

fs.writeFileSync('./package.json', JSON.stringify(json, undefined, 2));
