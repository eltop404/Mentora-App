import sys

def count_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    div_open = content.count('<div ') + content.count('<div>')
    div_close = content.count('</div>')
    
    motion_open = content.count('<motion.div')
    motion_close = content.count('</motion.div>')
    
    animate_open = content.count('<AnimatePresence')
    animate_close = content.count('</AnimatePresence>')
    
    curly_open = content.count('{')
    curly_close = content.count('}')
    
    paren_open = content.count('(')
    paren_close = content.count(')')
    
    print(f"div: {div_open} / {div_close}")
    print(f"motion.div: {motion_open} / {motion_close}")
    print(f"AnimatePresence: {animate_open} / {animate_close}")
    print(f"Curly: {curly_open} / {curly_close}")
    print(f"Paren: {paren_open} / {paren_close}")

if __name__ == "__main__":
    count_tags(sys.argv[1])
