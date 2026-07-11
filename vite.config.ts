import { defineConfig } from 'vite';

function patchRapierCompatInitializer(code: string, id: string): string | undefined {
  if (!id.includes('@dimforge/rapier3d-compat/rapier.mjs')) return undefined;

  const byteArrayMarker = '.toByteArray("';
  const byteArrayIndex = code.indexOf(byteArrayMarker);
  const yieldIndex = code.lastIndexOf('yield ', byteArrayIndex);
  const argumentStart = code.indexOf('(', yieldIndex) + 1;
  const bufferEnd = code.indexOf('.buffer', byteArrayIndex) + '.buffer'.length;
  const argumentEnd = code.indexOf(')', bufferEnd);

  if (byteArrayIndex < 0 || yieldIndex < 0 || argumentStart === 0 || bufferEnd < 7 || argumentEnd < 0) {
    throw new Error('Rapier compat initializer shape changed; update the wasm-bindgen argument patch.');
  }

  return `${code.slice(0, argumentStart)}{module_or_path:${code.slice(argumentStart, argumentEnd)}})${code.slice(argumentEnd + 1)}`;
}

export default defineConfig({
  plugins: [
    {
      name: 'rapier-compat-initializer',
      enforce: 'pre',
      transform: patchRapierCompatInitializer,
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 2_500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@dimforge/rapier3d-compat')) return 'physics';
          if (id.includes('/three/')) return 'three';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
