/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(file => { 
    file = path.resolve(dir, file); 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.tsx') && !file.includes('ui\\\\select.tsx') && !file.includes('ui\\\\native-select.tsx')) { 
      const content = fs.readFileSync(file, 'utf8'); 
      if (content.includes('<select')) results.push(file); 
    } 
  }); 
  return results; 
} 
const files = walk('c:/Users/kooth/Documents/Projects/VidyaAI/apps/frontend/src'); 
files.forEach(file => { 
  let content = fs.readFileSync(file, 'utf8'); 
  content = content.replace(/<select/g, '<NativeSelect'); 
  content = content.replace(/<\/select>/g, '</NativeSelect>'); 
  if (!content.includes('import { NativeSelect }')) { 
    const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g; 
    let match; 
    let lastIndex = 0; 
    while ((match = importRegex.exec(content)) !== null) { 
      lastIndex = importRegex.lastIndex; 
    } 
    const importStatement = "import { NativeSelect } from '@/components/ui/native-select';\n"; 
    if (lastIndex > 0) { 
      content = content.slice(0, lastIndex) + importStatement + content.slice(lastIndex); 
    } else { 
      content = importStatement + content; 
    } 
  } 
  fs.writeFileSync(file, content); 
  console.log('Updated', file); 
});
