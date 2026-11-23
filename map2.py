import re

def update_links(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Desktop/Mobile Nav Links
    text = re.sub(r'<a\s+href="[^"]*"([^>]*)>Home<', r'<a href="index.html"\1>Home<', text)
    text = re.sub(r'<a\s+href="[^"]*"([^>]*)>About Us<', r'<a href="about.html"\1>About Us<', text)
    
    # Footer Links (which might span Multiple Lines!)
    # I'll use regex to hit the exact footer class setup
    text = re.sub(r'href="[^"]*"\s+class="text-gray-400 hover:text-\[#D89A18\] font-\[450\] text-\[14px\] transition-colors flex items-center justify-between group">\s*Home',
                  r'href="index.html"\n                                class="text-gray-400 hover:text-[#D89A18] font-[450] text-[14px] transition-colors flex items-center justify-between group">Home', text)
                  
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

update_links('index.html')
update_links('about.html')
print("Mapped!")
