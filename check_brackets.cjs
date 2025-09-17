const fs = require('fs');
const content = fs.readFileSync('components/CellBreakGameFixed.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let inString = false;
let inComment = false;

for(let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let lineDepth = 0;

    for(let j = 0; j < line.length; j++) {
        const ch = line[j];
        const nextCh = line[j+1];

        // Skip strings
        if (ch === '"' || ch === "'") {
            if (!inComment && (j === 0 || line[j-1] !== '\\')) {
                inString = !inString;
            }
        }

        // Skip comments
        if (!inString && ch === '/' && nextCh === '/') {
            break; // Rest of line is comment
        }

        if (!inString && !inComment) {
            if(ch === '{') {
                depth++;
                lineDepth++;
            }
            if(ch === '}') {
                depth--;
                lineDepth--;
            }
        }
    }

    // Log problematic lines
    if (i >= 1295 && i <= 1305) {
        console.log(`Line ${i+1}: depth=${depth} (change=${lineDepth}) - ${line.trim().substring(0, 60)}`);
    }

    if (depth < 0) {
        console.log(`ERROR: Negative depth at line ${i+1}:`, line.substring(0, 60));
        break;
    }
}

console.log('Final depth:', depth);