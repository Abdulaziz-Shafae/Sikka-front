import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const command=process.argv[2];if(!['build','start'].includes(command))throw new Error('Expected build or start');
const port=process.env.PORT||'3000';if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('Invalid PORT');
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),command,...(command==='start'?['--hostname','0.0.0.0','--port',port]:['--webpack'])],{stdio:'inherit',env:{...process.env,SIKKA_RAILWAY_NODE:'1'}});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
