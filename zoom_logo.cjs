const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const logoUrl = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';
const regex = new RegExp('<img[^>]+src=["\\\']' + logoUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '["\\\'][^>]*>', 'g');

content = content.replace(regex, (match) => {
    let newMatch = match;
    
    // Add aspect-square, shrink-0, and scale-[1.35] to hide background
    if (!newMatch.includes('scale-[')) {
        newMatch = newMatch.replace('className="', 'className="aspect-square shrink-0 scale-[1.4] ');
        newMatch = newMatch.replace("className='", "className='aspect-square shrink-0 scale-[1.4] ");
    }
    
    // Make sure it has rounded-full
    if (!newMatch.includes('rounded-full')) {
        newMatch = newMatch.replace('className="', 'className="rounded-full ');
        newMatch = newMatch.replace("className='", "className='rounded-full ");
    }

    return newMatch;
});

// Since the logo might be inside a wrapper that has overflow-hidden, let's wrap it if needed or just rely on rounded-full doing the clipping.
// Wait! `scale-[1.4]` on an img with `rounded-full` will actually scale the whole img element, including its border radius, so the border radius will be outside the container!
// We should wrap the img in a div with `overflow-hidden rounded-full` OR we apply `scale-[1.4]` and ensure the container has `overflow-hidden`!
// Actually, `App.tsx` has things like `<img ... className="... rounded-full ...">`. If we add `scale-[1.4]`, it scales the <img> itself.
// But we want to crop the image content.
// The best way to zoom an image using CSS while keeping the container rounded is:
// <div className="w-32 h-32 rounded-full overflow-hidden shrink-0"><img src="..." className="w-full h-full object-cover scale-[1.4]" /></div>
// Since replacing HTML structures with regex is risky, what if we use object-position?
// `object-[center]` with `scale-[1.45]` and ensure the parent has `overflow-hidden`.
// But `<img>` tag with `rounded-full overflow-hidden` will hide the parts outside the radius even if scaled? NO, if the <img> is scaled, it physically becomes larger on screen, so the `rounded-full` border also becomes larger!
// Wait! If `<img>` has `border-radius: 50%`, it applies to the image's bounding box. If you scale the image, you scale the bounding box. So it remains circular, just bigger!
// But then it overflows its space and overlaps other things!
// So scaling the `<img>` directly is bad unless it is inside an `overflow-hidden` container.

// A safer way: CSS `clip-path: circle(35% at 50% 50%)`?
// Or we can just use inline styles to zoom it?
// Let's replace the `<img>` tags for the logo with a `<div>` that has background-image!
// Background image allows `background-size: 140%`, `background-position: center`.
// Let's do that!
