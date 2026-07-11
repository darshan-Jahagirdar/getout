import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from 'three/webgpu';
import type { QualityProfile } from '../../engine/Quality';
import { SeededRandom } from '../../engine/SeededRandom';

const DEG_TO_RAD = Math.PI / 180;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(minimum: number, maximum: number, value: number): number {
  const normalized = clamp01((value - minimum) / (maximum - minimum));
  return normalized * normalized * (3 - 2 * normalized);
}

function landSignal(u: number, v: number): number {
  const latitude = (v - 0.5) * Math.PI;
  const longitude = u * Math.PI * 2;
  return (
    Math.sin(longitude * 1.7 + Math.sin(latitude * 3.1)) * 0.55 +
    Math.sin(longitude * 3.8 - latitude * 2.2) * 0.28 +
    Math.cos(longitude * 7.2 + latitude * 5.3) * 0.13 -
    Math.abs(latitude) * 0.22
  );
}

function createEarthTextures(): readonly [CanvasTexture, CanvasTexture, CanvasTexture] {
  const width = 1_024;
  const height = 512;
  const dayCanvas = document.createElement('canvas');
  const nightCanvas = document.createElement('canvas');
  const cloudCanvas = document.createElement('canvas');
  dayCanvas.width = nightCanvas.width = cloudCanvas.width = width;
  dayCanvas.height = nightCanvas.height = cloudCanvas.height = height;
  const day = dayCanvas.getContext('2d');
  const night = nightCanvas.getContext('2d');
  const cloud = cloudCanvas.getContext('2d');
  if (day === null || night === null || cloud === null) throw new Error('Canvas textures unavailable');

  const pixels = day.createImageData(width, height);
  const data = pixels.data;
  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const ice = smoothstep(0.82, 1, Math.abs(v - 0.5) * 2);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const signal = landSignal(u, v);
      const offset = (y * width + x) * 4;
      if (signal > 0.16) {
        const arid = smoothstep(0.18, 0.7, signal + Math.abs(v - 0.5) * 0.25);
        data[offset] = 52 + arid * 72 + ice * 110;
        data[offset + 1] = 82 + arid * 50 + ice * 105;
        data[offset + 2] = 47 + arid * 22 + ice * 110;
      } else {
        const depth = clamp01(0.6 - signal);
        data[offset] = 4 + ice * 135;
        data[offset + 1] = 29 + depth * 18 + ice * 130;
        data[offset + 2] = 58 + depth * 42 + ice * 120;
      }
      data[offset + 3] = 255;
    }
  }
  day.putImageData(pixels, 0, 0);

  night.fillStyle = '#000000';
  night.fillRect(0, 0, width, height);
  const random = new SeededRandom(0x2049_0901);
  for (let index = 0; index < 2_500; index += 1) {
    const u = random.next();
    const v = random.range(0.14, 0.86);
    if (landSignal(u, v) <= 0.22) continue;
    const radius = random.range(0.35, 1.15);
    night.fillStyle = random.next() > 0.28 ? '#ffb65c' : '#fff1b5';
    night.beginPath();
    night.arc(u * width, v * height, radius, 0, Math.PI * 2);
    night.fill();
  }

  const clouds = cloud.createImageData(width, height);
  const cloudData = clouds.data;
  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const noise =
        Math.sin(u * 51 + Math.sin(v * 17) * 3) * 0.45 +
        Math.cos(u * 93 - v * 37) * 0.3 +
        Math.sin(u * 181 + v * 71) * 0.15;
      const alpha = smoothstep(0.38, 0.75, noise);
      const offset = (y * width + x) * 4;
      cloudData[offset] = 220;
      cloudData[offset + 1] = 232;
      cloudData[offset + 2] = 240;
      cloudData[offset + 3] = alpha * 125;
    }
  }
  cloud.putImageData(clouds, 0, 0);

  const dayTexture = new CanvasTexture(dayCanvas);
  const nightTexture = new CanvasTexture(nightCanvas);
  const cloudTexture = new CanvasTexture(cloudCanvas);
  dayTexture.colorSpace = SRGBColorSpace;
  nightTexture.colorSpace = SRGBColorSpace;
  cloudTexture.colorSpace = SRGBColorSpace;
  dayTexture.wrapS = nightTexture.wrapS = cloudTexture.wrapS = ClampToEdgeWrapping;
  return [dayTexture, nightTexture, cloudTexture];
}

function addBox(
  parent: Group,
  geometry: BoxGeometry,
  material: MeshStandardMaterial | MeshBasicMaterial,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  parent.add(mesh);
  return mesh;
}

export class Act0Scene {
  public readonly scene = new Scene();

  private readonly camera: PerspectiveCamera;
  private readonly cameraRig = new Group();
  private readonly earth = new Group();
  private readonly station = new Group();
  private readonly pen = new Group();
  private readonly fairingLeft = new Group();
  private readonly fairingRight = new Group();
  private readonly starsGeometry: BufferGeometry;
  private readonly earthDayTexture: CanvasTexture;
  private readonly earthNightTexture: CanvasTexture;
  private readonly earthCloudTexture: CanvasTexture;
  private previousMissionTime = -120;
  private currentMissionTime = -120;
  private previousDockX = 0.65;
  private currentDockX = 0.65;
  private previousDockY = -0.42;
  private currentDockY = -0.42;
  private previousDockRoll = 0.35;
  private currentDockRoll = 0.35;
  private stageSeparated = false;

  public constructor(camera: PerspectiveCamera, profile: QualityProfile) {
    this.camera = camera;
    this.scene.background = new Color(0x010204);
    this.camera.position.set(0, 0.15, 4.8);
    this.camera.rotation.set(-1.5 * DEG_TO_RAD, 0, 0);
    this.cameraRig.add(camera);
    this.scene.add(this.cameraRig);

    const hemisphere = new HemisphereLight(0x87b9d5, 0x08090b, 0.85);
    const sun = new DirectionalLight(0xfff1d2, 5.5);
    sun.position.set(-18, 8, 14);
    sun.castShadow = profile.shadows;
    this.scene.add(hemisphere, sun);

    const cockpitGlow = new PointLight(0x5ecbff, 4.2, 18, 2);
    cockpitGlow.position.set(0, -1.2, 2.5);
    this.scene.add(cockpitGlow);

    this.buildCockpit();
    const textures = createEarthTextures();
    this.earthDayTexture = textures[0];
    this.earthNightTexture = textures[1];
    this.earthCloudTexture = textures[2];
    this.buildEarth();
    this.buildStation();
    this.buildPen();
    this.starsGeometry = this.buildStars();
    this.applyQuality(profile);
  }

  public applyQuality(profile: QualityProfile): void {
    this.starsGeometry.setDrawRange(0, profile.starCount);
  }

  public fixedUpdate(missionTime: number, dockX: number, dockY: number, dockRoll: number): void {
    this.previousMissionTime = this.currentMissionTime;
    this.currentMissionTime = missionTime;
    this.previousDockX = this.currentDockX;
    this.currentDockX = dockX;
    this.previousDockY = this.currentDockY;
    this.currentDockY = dockY;
    this.previousDockRoll = this.currentDockRoll;
    this.currentDockRoll = dockRoll;
  }

  public setStageSeparated(): void {
    this.stageSeparated = true;
  }

  public render(alpha: number, elapsedSeconds: number): void {
    const missionTime = this.previousMissionTime + (this.currentMissionTime - this.previousMissionTime) * alpha;
    const dockX = this.previousDockX + (this.currentDockX - this.previousDockX) * alpha;
    const dockY = this.previousDockY + (this.currentDockY - this.previousDockY) * alpha;
    const dockRoll = this.previousDockRoll + (this.currentDockRoll - this.previousDockRoll) * alpha;

    const ascent = smoothstep(0, 12, missionTime) * (1 - smoothstep(235, 240, missionTime));
    const maxQ = 0.35 + smoothstep(50, 70, missionTime) * 0.65;
    const shake = ascent * maxQ;
    this.cameraRig.position.x = Math.sin(elapsedSeconds * 53.7) * 0.018 * shake;
    this.cameraRig.position.y = Math.sin(elapsedSeconds * 47.1 + 0.8) * 0.024 * shake;
    this.cameraRig.rotation.z = Math.sin(elapsedSeconds * 39.4) * 0.0028 * shake;

    const fairingProgress = smoothstep(180, 184, missionTime);
    this.fairingLeft.position.x = -2.9 - fairingProgress * 18;
    this.fairingRight.position.x = 2.9 + fairingProgress * 18;
    this.fairingLeft.rotation.z = fairingProgress * 0.42;
    this.fairingRight.rotation.z = -fairingProgress * 0.42;

    this.earth.visible = missionTime >= 178;
    this.earth.rotation.y = elapsedSeconds * 0.012 + 0.55;
    const earthDeparture = smoothstep(250, 285, missionTime);
    this.earth.position.x = -2 - earthDeparture * 22;
    this.earth.position.y = -10 - earthDeparture * 4;
    this.earth.rotation.z = -0.26;

    this.pen.visible = missionTime >= 240;
    if (this.pen.visible) {
      const floatTime = Math.max(0, missionTime - 240);
      this.pen.position.x = 0.9 + Math.sin(floatTime * 0.34) * 0.45;
      this.pen.position.y = -0.4 + Math.sin(floatTime * 0.21) * 0.62;
      this.pen.position.z = 1.7 + Math.cos(floatTime * 0.18) * 0.25;
      this.pen.rotation.x = floatTime * 0.31;
      this.pen.rotation.z = floatTime * 0.19;
    }

    this.station.visible = missionTime >= 268;
    if (this.station.visible) {
      const approach = smoothstep(270, 300, missionTime);
      const alignmentWeight = smoothstep(284, 294, missionTime);
      this.station.position.x = 5.4 * (1 - approach) + dockX * 4 * alignmentWeight;
      this.station.position.y = 1.8 * (1 - approach) + dockY * 4 * alignmentWeight;
      this.station.position.z = -96 + approach * 81;
      this.station.rotation.z = 0.18 * (1 - approach) + dockRoll * alignmentWeight;
      const stationScale = 0.55 + approach * 0.72;
      this.station.scale.setScalar(stationScale);
    }

    if (this.stageSeparated && missionTime < 155) {
      this.cameraRig.position.z = Math.sin(elapsedSeconds * 22) * 0.025;
    } else {
      this.cameraRig.position.z = 0;
    }
  }

  public dispose(): void {
    this.earthDayTexture.dispose();
    this.earthNightTexture.dispose();
    this.earthCloudTexture.dispose();
    this.starsGeometry.dispose();
    this.scene.clear();
  }

  private buildCockpit(): void {
    const cockpit = new Group();
    const cube = new BoxGeometry(1, 1, 1);
    const shell = new MeshStandardMaterial({ color: 0x151a1d, roughness: 0.72, metalness: 0.68 });
    const trim = new MeshStandardMaterial({ color: 0x737b7c, roughness: 0.43, metalness: 0.82 });
    const dark = new MeshStandardMaterial({ color: 0x080b0c, roughness: 0.86, metalness: 0.45 });
    const cyan = new MeshStandardMaterial({
      color: 0x0c252e,
      emissive: 0x39c9f4,
      emissiveIntensity: 2.8,
      roughness: 0.3,
    });
    const amber = new MeshStandardMaterial({
      color: 0x31210b,
      emissive: 0xffa128,
      emissiveIntensity: 2.2,
      roughness: 0.35,
    });

    addBox(cockpit, cube, shell, 0, -3.8, -1.5, 12, 1.7, 9);
    addBox(cockpit, cube, shell, -6.2, 0, -1.5, 1.2, 7, 9);
    addBox(cockpit, cube, shell, 6.2, 0, -1.5, 1.2, 7, 9);
    addBox(cockpit, cube, shell, 0, 4.2, -1.5, 12, 1.1, 9);
    addBox(cockpit, cube, dark, 0, -2.65, 0.1, 6.8, 1.2, 2.6);
    addBox(cockpit, cube, trim, -4.25, 0.2, -4.7, 0.3, 7.4, 0.5);
    addBox(cockpit, cube, trim, 4.25, 0.2, -4.7, 0.3, 7.4, 0.5);
    addBox(cockpit, cube, trim, 0, 3.15, -4.7, 8.4, 0.28, 0.5);
    addBox(cockpit, cube, trim, 0, -2.45, -4.7, 8.4, 0.28, 0.5);
    for (let index = 0; index < 8; index += 1) {
      addBox(cockpit, cube, index % 3 === 0 ? amber : cyan, -2.8 + index * 0.8, -2.12, 1.48, 0.42, 0.045, 0.05);
    }
    for (let index = 0; index < 5; index += 1) {
      addBox(cockpit, cube, cyan, -5.52, 1.8 - index * 0.7, -0.2, 0.045, 0.34, 0.55);
      addBox(cockpit, cube, index === 3 ? amber : cyan, 5.52, 1.8 - index * 0.7, -0.2, 0.045, 0.34, 0.55);
    }

    const glass = new Mesh(
      new PlaneGeometry(8.2, 5.5),
      new MeshBasicMaterial({ color: 0x183c4b, transparent: true, opacity: 0.055, side: DoubleSide }),
    );
    glass.position.set(0, 0.25, -4.92);
    cockpit.add(glass);
    this.scene.add(cockpit);

    const fairingMaterial = new MeshStandardMaterial({ color: 0xd5d3c9, roughness: 0.84, metalness: 0.2 });
    addBox(this.fairingLeft, cube, fairingMaterial, 0, 0, 0, 5.8, 10, 0.7);
    addBox(this.fairingRight, cube, fairingMaterial, 0, 0, 0, 5.8, 10, 0.7);
    this.fairingLeft.position.set(-2.9, 0, -11.5);
    this.fairingRight.position.set(2.9, 0, -11.5);
    this.scene.add(this.fairingLeft, this.fairingRight);
  }

  private buildEarth(): void {
    const surface = new Mesh(
      new SphereGeometry(12, 96, 64),
      new MeshStandardMaterial({
        color: 0xffffff,
        map: this.earthDayTexture,
        emissive: 0xffa75a,
        emissiveMap: this.earthNightTexture,
        emissiveIntensity: 1.7,
        roughness: 0.78,
        metalness: 0.02,
      }),
    );
    const clouds = new Mesh(
      new SphereGeometry(12.12, 96, 64),
      new MeshStandardMaterial({
        color: 0xd9efff,
        alphaMap: this.earthCloudTexture,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        roughness: 0.92,
      }),
    );
    const atmosphere = new Mesh(
      new SphereGeometry(12.65, 72, 48),
      new MeshBasicMaterial({
        color: 0x45b7ff,
        transparent: true,
        opacity: 0.14,
        side: BackSide,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.earth.add(surface, clouds, atmosphere);
    this.earth.position.set(-2, -10, -44);
    this.earth.visible = false;
    this.scene.add(this.earth);
  }

  private buildStation(): void {
    const hull = new MeshStandardMaterial({ color: 0x8b9291, roughness: 0.64, metalness: 0.78 });
    const dark = new MeshStandardMaterial({ color: 0x161b1c, roughness: 0.74, metalness: 0.62 });
    const solar = new MeshStandardMaterial({ color: 0x071b3e, roughness: 0.38, metalness: 0.78 });
    const beacon = new MeshBasicMaterial({ color: 0xff4c24 });
    const cube = new BoxGeometry(1, 1, 1);
    const core = new Mesh(new CylinderGeometry(1.5, 1.5, 9, 24), hull);
    core.rotation.x = Math.PI / 2;
    this.station.add(core);
    const ring = new Mesh(new TorusGeometry(5.5, 0.72, 14, 64), hull);
    ring.rotation.y = Math.PI / 2;
    ring.position.z = -1.5;
    this.station.add(ring);
    addBox(this.station, cube, dark, 0, 0, 5.1, 2.8, 2.8, 1.4);
    addBox(this.station, cube, hull, -5.8, 0, 0.7, 7.5, 0.22, 0.22);
    addBox(this.station, cube, hull, 5.8, 0, 0.7, 7.5, 0.22, 0.22);
    addBox(this.station, cube, solar, -8.4, 0, 0.7, 4.2, 3.8, 0.09);
    addBox(this.station, cube, solar, 8.4, 0, 0.7, 4.2, 3.8, 0.09);
    const port = new Mesh(new TorusGeometry(1.2, 0.16, 12, 36), beacon);
    port.position.z = 5.86;
    this.station.add(port);
    this.station.visible = false;
    this.scene.add(this.station);
  }

  private buildPen(): void {
    const body = new Mesh(
      new CylinderGeometry(0.025, 0.025, 0.72, 10),
      new MeshStandardMaterial({ color: 0xd5d8d3, roughness: 0.4, metalness: 0.72 }),
    );
    body.rotation.z = Math.PI / 2;
    const cap = new Mesh(
      new CylinderGeometry(0.033, 0.033, 0.14, 10),
      new MeshStandardMaterial({ color: 0xe8492f, roughness: 0.46, metalness: 0.28 }),
    );
    cap.rotation.z = Math.PI / 2;
    cap.position.x = 0.4;
    this.pen.add(body, cap);
    this.pen.visible = false;
    this.scene.add(this.pen);
  }

  private buildStars(): BufferGeometry {
    const maximumStars = 4_000;
    const positions = new Float32Array(maximumStars * 3);
    const colors = new Float32Array(maximumStars * 3);
    const random = new SeededRandom(0x57a2_2049);
    for (let index = 0; index < maximumStars; index += 1) {
      const theta = random.range(0, Math.PI * 2);
      const phi = Math.acos(random.range(-1, 1));
      const radius = random.range(180, 420);
      const offset = index * 3;
      positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
      positions[offset + 1] = radius * Math.cos(phi);
      positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
      const warmth = random.next();
      colors[offset] = 0.72 + warmth * 0.28;
      colors[offset + 1] = 0.78 + warmth * 0.18;
      colors[offset + 2] = 0.9 + (1 - warmth) * 0.1;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    const points = new Points(
      geometry,
      new PointsMaterial({ size: 0.55, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.9 }),
    );
    this.scene.add(points);
    return geometry;
  }
}
