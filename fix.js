const fs = require('fs');

try {
  let content = fs.readFileSync('src/App.tsx', 'utf8');
  // Content is currently decoded as utf8, but it contains double-encoded utf8 bytes.
  // We need to convert it back to a buffer using the default Windows encoding.
  // Node.js 'latin1' (or 'binary') maps 1-to-1 to bytes.
  
  // Since it was likely cp1252 or cp1256, let's try reading it directly.
  // Wait, if it was cp1256, it's more complicated. 
  // Let's try latin1 first.
  let buffer = Buffer.from(content, 'latin1');
  let fixedContent = buffer.toString('utf8');
  
  if (fixedContent.includes('مغلق حالياً')) {
     fs.writeFileSync('src/App.tsx', fixedContent, 'utf8');
     console.log('Fixed using latin1!');
     process.exit(0);
  }
  
  console.log('Could not fix using latin1, might need windows-1256. Buffer length:', buffer.length);
} catch (e) {
  console.error(e);
  process.exit(1);
}
