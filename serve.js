// tiny static dev server: index.html at /, everything in ./public at /
const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm'};
http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/'||u.endsWith('.html'))u='/index.html';
 let f=u==='/index.html'?path.join(__dirname,'index.html'):path.join(__dirname,'public',u);
 fs.stat(f,(e,st)=>{if(e||!st.isFile()){s.writeHead(404);return s.end('nf')}
  const t=types[path.extname(f)]||'application/octet-stream',size=st.size,r=q.headers.range;
  if(r){const m=/bytes=(\d*)-(\d*)/.exec(r);const a=+m[1]||0,b=m[2]?+m[2]:size-1;s.writeHead(206,{'Content-Type':t,'Content-Range':`bytes ${a}-${b}/${size}`,'Accept-Ranges':'bytes','Content-Length':b-a+1});fs.createReadStream(f,{start:a,end:b}).pipe(s)}
  else{s.writeHead(200,{'Content-Type':t,'Content-Length':size,'Accept-Ranges':'bytes'});fs.createReadStream(f).pipe(s)}})
}).listen(5173,()=>console.log('http://localhost:5173'));
