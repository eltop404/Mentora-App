const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// Add smooth scrolling to nav-scroll-x and html
if (!content.includes('scroll-behavior: smooth')) {
  content = content.replace(/html \{/g, 'html {\n  scroll-behavior: smooth;\n');
}

// Ensure nav-scroll-x has smooth scrolling
content = content.replace(/\.nav-scroll-x \{/g, '.nav-scroll-x {\n  scroll-behavior: smooth;\n');

fs.writeFileSync('src/index.css', content);
console.log('CSS optimized');
