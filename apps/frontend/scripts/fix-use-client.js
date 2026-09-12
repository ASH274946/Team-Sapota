/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("'use client'") || content.includes('"use client"')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/kooth/Documents/Projects/VidyaAI/apps/frontend/src');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Find the first occurrence of use client
  const match = content.match(/['"]use client['"];?/);
  if (match) {
    const before = content.slice(0, match.index);
    // If there is any code before 'use client', move it to the top
    if (before.trim().length > 0) {
      content = content.replace(match[0], '');
      content = "'use client';\n" + content.trimStart();
      fs.writeFileSync(file, content);
      console.log('Fixed use client in:', file);
      count++;
    }
  }
});
console.log('Total fixed:', count);
