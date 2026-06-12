const { createServer } = require('vite');
const esbuild = require('esbuild');
const { spawn } = require('child_process');
const path = require('path');

async function startDev() {
  console.log('🔨 Compiling main and preload processes...');
  try {
    await esbuild.build({
      entryPoints: [
        path.join(__dirname, '../src/main/index.ts'),
        path.join(__dirname, '../src/preload/index.ts'),
      ],
      bundle: true,
      platform: 'node',
      outdir: path.join(__dirname, '../dist'),
      external: ['electron', 'node:sqlite'],
    });
    console.log('✅ Compile complete.');
  } catch (err) {
    console.error('❌ Compilation failed:', err);
    process.exit(1);
  }

  console.log('⚡ Starting Vite development server...');
  const server = await createServer({
    configFile: path.join(__dirname, '../vite.config.ts'),
    server: { port: 5173 }
  });
  await server.listen();
  console.log('🚀 Vite server ready at http://localhost:5173');

  console.log('👀 Watching main & preload processes for changes...');
  const ctx = await esbuild.context({
    entryPoints: [
      path.join(__dirname, '../src/main/index.ts'),
      path.join(__dirname, '../src/preload/index.ts'),
    ],
    bundle: true,
    platform: 'node',
    outdir: path.join(__dirname, '../dist'),
    external: ['electron', 'node:sqlite'],
  });
  await ctx.watch();

  console.log('💻 Launching Electron window...');
  const electronProcess = spawn(
    require('electron'), 
    [path.join(__dirname, '../dist/main/index.js')], 
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://localhost:5173'
      }
    }
  );

  electronProcess.on('close', async () => {
    console.log('🛑 Electron exited. Terminating dev servers...');
    await server.close();
    await ctx.dispose();
    process.exit(0);
  });
}

startDev().catch(err => {
  console.error('❌ Error during development startup:', err);
  process.exit(1);
});
