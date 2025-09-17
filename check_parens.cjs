const fs = require('fs');
const code = fs.readFileSync('components/CellBreakGameFixed.tsx', 'utf8');
const lines = code.split('\n');

let depth = 0;
for(let i = 460; i < 1306; i++) {
    const line = lines[i] || '';
    let lineOpen = 0, lineClose = 0;

    for(const char of line) {
        if(char === '(') {
            depth++;
            lineOpen++;
        }
        if(char === ')') {
            depth--;
            lineClose++;
        }
    }

    if(lineOpen !== lineClose && i >= 1280 && i <= 1305) {
        console.log('Line', i+1, ': opens=', lineOpen, 'closes=', lineClose, 'depth=', depth);
        console.log('  ', line.substring(0, 100));
    }
}

console.log('Final depth at line 1306:', depth);