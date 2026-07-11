import { cp, mkdir } from 'node:fs/promises';

await mkdir('public/decoders/draco', { recursive: true });
await mkdir('public/decoders/basis', { recursive: true });
await cp('node_modules/three/examples/jsm/libs/draco/gltf', 'public/decoders/draco', {
  recursive: true,
});
await cp('node_modules/three/examples/jsm/libs/basis', 'public/decoders/basis', {
  recursive: true,
});
