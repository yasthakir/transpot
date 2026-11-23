import re
h=open('index.html').read()
css=open('public/cinematic.css').read(); js=open('public/cinematic.js').read()
i=h.rindex('<style>'); j=h.index('</style>',i)+8
h=h[:i]+'<style>\n'+css+'\n</style>'+h[j:]
i=h.rindex('<script>'); j=h.index('</script>',i)+9
h=h[:i]+'<script>\n'+js+'\n</script>'+h[j:]
open('index.html','w').write(h)
