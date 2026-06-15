const fs = require('fs');

function fixLayout() {
    // Fix index.css
    let css = fs.readFileSync('src/index.css', 'utf8');
    
    // Add background to html
    if (!css.includes('background-color: #020617;')) {
        css = css.replace(/html \{[\s\S]*?\}/, `html {\n  scroll-behavior: smooth;\n  background-color: #020617;\n  overscroll-behavior-y: none;\n}`);
        
        css = css.replace(/body \{[\s\S]*?\}/, `body {\n  background-color: #020617;\n  color: white;\n  overflow-x: hidden;\n  overflow-y: auto;\n  width: 100vw;\n  max-width: 100%;\n  direction: rtl;\n  scrollbar-gutter: auto;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  font-display: swap;\n  overscroll-behavior-y: none;\n}`);
    }

    // Ensure layout-container handles mobile properly
    css = css.replace(/min-height: 100dvh;/g, 'min-height: 100vh;\n  min-height: 100dvh;\n  padding-top: env(safe-area-inset-top);\n  padding-bottom: env(safe-area-inset-bottom);');
    
    fs.writeFileSync('src/index.css', css);

    // Fix index.html
    let html = fs.readFileSync('index.html', 'utf8');
    html = html.replace(/<meta name="theme-color" content=".*?" \/>/, '<meta name="theme-color" content="#020617" />');
    html = html.replace(/<meta name="viewport".*?>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=0">');
    html = html.replace(/<body style=".*?">/, '<body style="background:#020617;color:#fff;margin:0;padding:0;overscroll-behavior-y:none;">');
    fs.writeFileSync('index.html', html);

    // Fix App.tsx welcome screen wrapper
    let app = fs.readFileSync('src/App.tsx', 'utf8');
    // Ensure the welcome screen is fixed properly by overriding the relative class if needed
    // or just let it be since adding padding to layout-container might fix the gap
    app = app.replace('className={cn("fixed inset-0 z-10', 'className={cn("!fixed inset-0 z-[100] bg-[#020617]');
    fs.writeFileSync('src/App.tsx', app);

    console.log('Fixed mobile layout gaps and lag');
}

try {
    fixLayout();
} catch(e) {
    console.error(e);
}
