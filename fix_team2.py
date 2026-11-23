import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the glass overlay div from the 4 team cards
text = re.sub(
    r'<div class="absolute inset-0 bg-\[#0E1B14\]/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-\[2px\] flex items-center justify-center">\s*<a[^>]*>\s*<i[^>]*></i>\s*</a>\s*</div>',
    '',
    text,
    flags=re.DOTALL
)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed hover overlay")
