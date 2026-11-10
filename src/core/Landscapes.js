import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const palette = {
  pine: "#243e33",
  trunk: "#584939",
  stone: "#c3ad80",
  grass: "#9ba376",
};
let seed = 451;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function mat(c, extra = {}) {
  return new T.MeshStandardMaterial({ color: c, roughness: 0.95, ...extra });
}
function mesh(g, m, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.receiveShadow = true;
  o.castShadow = true;
  return o;
}
function ell(parent, c, p, s, segments = 20) {
  const o = mesh(new T.SphereGeometry(1, segments, 12), mat(c), ...p);
  o.scale.set(...s);
  parent.add(o);
  return o;
}
function cylinder(parent, c, r1, r2, h, p) {
  const o = mesh(new T.CylinderGeometry(r1, r2, h, 16), mat(c), ...p);
  parent.add(o);
  return o;
}
function terrain(parent, w, d, fn, color, segments = 100) {
  const g = new T.PlaneGeometry(w, d, segments, segments);
  g.rotateX(-Math.PI / 2);
  const a = g.attributes.position,
    col = [];
  const base = new T.Color(color);
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i),
      z = a.getZ(i),
      h = fn(x, z);
    a.setY(i, h);
    const mineral =
      color === "#c4a26d"
        ? 0.08 * Math.sin(h * 8 + x * 0.1) + 0.04 * Math.sin(h * 21)
        : 0;
    const v =
      0.88 + 0.1 * Math.sin(x * 1.6 + z * 0.7) + rand() * 0.09 + mineral;
    col.push(base.r * v, base.g * v, base.b * v);
  }
  g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const o = mesh(g, mat(color, { color: 0xffffff, vertexColors: true }));
  parent.add(o);
  return o;
}
function pine(parent, x, y, z, s = 1) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  cylinder(g, palette.trunk, 0.08, 0.13, 1.5, [0, 0.7, 0]);
  for (let j = 0; j < 7; j++) {
    const cg = new T.ConeGeometry(0.8 - j * 0.085, 1.05, 12);
    const ca = cg.attributes.position;
    for (let k = 0; k < ca.count; k++) {
      const u = 1 + 0.08 * Math.sin(k * 2.4 + j);
      ca.setX(k, ca.getX(k) * u);
      ca.setZ(k, ca.getZ(k) * u);
    }
    cg.computeVertexNormals();
    const c = mesh(
      cg,
      mat(j % 2 ? "#314c3e" : "#274334"),
      0,
      0.85 + j * 0.29,
      0,
    );
    g.add(c);
  }
  parent.add(g);
}
function mountains(parent, color) {
  const ridge = new T.Group();
  terrain(
    ridge,
    160,
    160,
    (x, z) => {
      const wz = z - 100;
      const k = T.MathUtils.smoothstep(-wz, 28, 55);
      return (
        -0.55 +
        k *
          (2.5 +
            3 * Math.pow(0.5 + 0.5 * Math.sin(x * 0.08), 2) +
            1.1 * Math.sin(x * 0.18) * Math.cos(wz * 0.06))
      );
    },
    color,
    140,
  );
  ridge.position.z = -100;
  parent.add(ridge);
}
function water(parent, color, w, d, y = 0, x = 0, z = 0) {
  const o = mesh(
    new T.PlaneGeometry(w, d),
    mat(color, { roughness: 0.28, metalness: 0.15 }),
    x,
    y,
    z,
  );
  o.rotation.x = -Math.PI / 2;
  parent.add(o);
  return o;
}
function ribbon(parent, points, width, color) {
  const vertices = [],
    indices = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      next = points[Math.min(i + 1, points.length - 1)],
      prev = points[Math.max(0, i - 1)],
      dx = next[0] - prev[0],
      dz = next[2] - prev[2],
      l = Math.hypot(dx, dz) || 1;
    vertices.push(
      p[0] - (dz / l) * width,
      p[1],
      p[2] + (dx / l) * width,
      p[0] + (dz / l) * width,
      p[1],
      p[2] - (dx / l) * width,
    );
    if (i < points.length - 1) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = mesh(g, mat(color, { side: T.DoubleSide, roughness: 0.35 }));
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}
function steamTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d"),
    g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, "rgba(246,250,239,.65)");
  g.addColorStop(0.35, "rgba(246,250,239,.32)");
  g.addColorStop(1, "rgba(246,250,239,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new T.CanvasTexture(c);
}
const descriptors = [
  [
    "Geyser basin",
    "Mineral terraces, lodgepole pines and a plume of geothermal water.",
    ["#79aab8", "#bbd2cf"],
    [14, 9, 25],
    [0, 3, 0],
  ],
  [
    "Grand Prismatic",
    "Blue at the heart. Rings of heat-loving life around the edge.",
    ["#8abfc6", "#b9d2c9"],
    [17, 21, 24],
    [0, 0, 0],
  ],
  [
    "Canyon & Lower Falls",
    "A white ribbon of water cuts through Yellowstone's golden canyon.",
    ["#7eaebc", "#c2d7d1"],
    [4, 19, 30],
    [0, 2, -7],
  ],
  [
    "Lamar Valley",
    "Bison, a winding river and the long sweep of open country.",
    ["#7ea5b6", "#cedacd"],
    [16, 8, 23],
    [0, 2, 0],
  ],
  [
    "Caldera country",
    "A surface landscape of forest, lake and an ancient volcanic basin.",
    ["#7ca8be", "#c7dad6"],
    [20, 18, 26],
    [0, 1, -4],
  ],
];
export function createLandscapes() {
  const scenes = [],
    animated = [],
    steam = steamTexture();
  for (let i = 0; i < 5; i++) {
    seed = 451 + i * 100;
    const g = new T.Group();
    scenes.push(g);
    mountains(g, ["#6e8e83", "#6e8d80", "#607e75", "#667d70", "#708b83"][i]);
    if (i === 0) {
      terrain(
        g,
        66,
        66,
        (x, z) => -0.4 + 0.1 * Math.sin(x * 0.6) * Math.cos(z * 0.5),
        "#d8c9a2",
      );
      const mound = terrain(
        g,
        16,
        16,
        (x, z) => {
          const r = Math.hypot(x, z);
          return 0.1 + 1.05 * Math.exp((-r * r) / 13) + 0.07 * Math.sin(r * 6);
        },
        "#e3d9b9",
      );
      const cone = cylinder(g, "#c9bd99", 0.8, 1.5, 0.6, [0, 1, 0]);
      water(g, "#3e9d9c", 1.3, 1.3, 1.32);
      for (let j = 0; j < 32; j++) {
        const p = new T.Sprite(
          new T.SpriteMaterial({
            map: steam,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }),
        );
        const a = j * 2.4,
          r = 0.1 + rand() * 0.65;
        p.position.set(Math.cos(a) * r, 1.4 + j * 0.19, Math.sin(a) * r);
        p.scale.setScalar(0.6 + j * 0.085);
        g.add(p);
        animated.push({ o: p, type: "steam", base: p.position.clone(), j });
      }
      for (let j = 0; j < 9; j++) {
        const jet = mesh(
          new T.CylinderGeometry(
            0.035 + j * 0.004,
            0.08,
            3.8 + Math.sin(j) * 0.6,
            8,
          ),
          mat("#e6f5e8", { transparent: true, opacity: 0.8 }),
          Math.sin(j * 2) * 0.25,
          3.2,
          Math.cos(j * 2) * 0.25,
        );
        g.add(jet);
      }
      for (let j = 0; j < 40; j++) {
        let x = (rand() - 0.5) * 55,
          z = -8 - rand() * 18;
        if (Math.abs(x) < 4) continue;
        pine(g, x, -0.3, z, 0.8 + rand() * 0.5);
      }
      for (let j = 0; j < 24; j++) {
        const b = mesh(
          new T.BoxGeometry(0.55, 0.13, 2),
          mat("#806a49"),
          -9 + j * 0.76,
          0.1,
          7.5 + Math.sin(j * 0.11),
        );
        g.add(b);
      }
      for (let j = 0; j < 12; j++) {
        const x = -9 + j * 1.55;
        cylinder(g, "#715d42", 0.055, 0.055, 0.9, [x, 0.5, 6.55]);
      }
      const rail = mesh(
        new T.BoxGeometry(18, 0.08, 0.09),
        mat("#715d42"),
        0,
        0.91,
        6.55,
      );
      g.add(rail);
    }
    if (i === 1) {
      terrain(
        g,
        66,
        66,
        (x, z) => -0.28 + 0.06 * Math.sin(x * 0.7 + z * 0.4),
        "#d6c8a1",
      );
      const geo = new T.CircleGeometry(10.2, 180);
      geo.rotateX(-Math.PI / 2);
      const material = new T.ShaderMaterial({
        side: T.DoubleSide,
        uniforms: {},
        vertexShader: `varying vec2 p;void main(){p=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 p;void main(){float a=atan(p.y,p.x);float r=length(p)*(1.+.023*sin(a*7.)+.016*sin(a*13.));vec3 c=vec3(.02,.21,.38);c=mix(c,vec3(.01,.48,.62),smoothstep(2.,5.8,r));c=mix(c,vec3(.07,.63,.58),smoothstep(5.0,6.1,r));c=mix(c,vec3(.52,.68,.29),smoothstep(6.0,6.6,r));c=mix(c,vec3(.92,.68,.15),smoothstep(6.5,7.3,r));c=mix(c,vec3(.78,.31,.08),smoothstep(7.2,8.6,r));c=mix(c,vec3(.81,.59,.30),smoothstep(8.6,9.9,r));float veins=pow(max(0.,sin(a*91.+sin(r*2.+a*5.)*2.+sin(a*19.)*3.)),14.);c*=1.-.10*veins*smoothstep(6.5,8.,r);gl_FragColor=vec4(c,1.);}`,
      });
      const pool = mesh(geo, material, 0, 0.02, 0);
      pool.scale.z = 0.85;
      g.add(pool);
      for (let j = 0; j < 38; j++) {
        const a = (j / 38) * Math.PI * 2,
          r = 10.4 + rand() * 3;
        const x = Math.cos(a) * r,
          z = Math.sin(a) * r * 0.85;
        ell(
          g,
          "#ded3ac",
          [x, -0.01, z],
          [0.3 + rand() * 0.4, 0.08, 0.18 + rand() * 0.3],
          12,
        );
      }
      for (let j = 0; j < 45; j++) {
        const x = (rand() - 0.5) * 52,
          z = -13 - rand() * 15;
        pine(g, x, -0.2, z, 0.65 + rand() * 0.4);
      }
      for (let j = 0; j < 11; j++) {
        const p = new T.Sprite(
          new T.SpriteMaterial({
            map: steam,
            transparent: true,
            opacity: 0.11,
            depthWrite: false,
          }),
        );
        p.position.set((rand() - 0.5) * 9, 0.5 + rand(), (rand() - 0.5) * 6);
        p.scale.set(5, 1.3, 1);
        g.add(p);
        animated.push({ o: p, type: "mist", base: p.position.clone(), j });
      }
    }
    if (i === 2) {
      const fn = (x, z) => {
        const center = Math.sin((z + 11) * 0.11) * 2;
        const d = Math.abs(x - center);
        const base =
          -1.1 +
          Math.pow(Math.min(Math.max(0, d - 2.5) / 12, 1), 0.8) * 11 +
          T.MathUtils.smoothstep(d, 2.5, 5) *
            (0.6 * Math.sin(x * 0.6 + z * 0.4) +
              0.4 * Math.sin(x * 1.4 - z * 0.7));
        return Math.max(
          base,
          -1.1 +
            (8.1 +
              0.5 *
                Math.sin(x * 0.85) *
                T.MathUtils.smoothstep(Math.abs(x), 1.3, 4)) *
              T.MathUtils.smoothstep(
                -z +
                  0.65 *
                    Math.sin(x * 0.8) *
                    T.MathUtils.smoothstep(Math.abs(x), 1.3, 4),
                10.8,
                11.55,
              ) +
            0.05 * Math.sin(x * 3),
        );
      };
      terrain(g, 56, 66, fn, "#c4a26d", 180);
      const pts = [];
      for (let z = -10.7; z <= 30; z += 0.5)
        pts.push([Math.sin((z + 11) * 0.11) * 2, -1.02, z]);
      ribbon(g, pts, 0.8, "#417f81");
      const foam = [];
      for (let z = -10.5; z < -4; z += 0.3)
        foam.push([
          Math.sin((z + 11) * 0.11) * 2 + 0.12 * Math.sin(z * 3),
          -1.005,
          z,
        ]);
      ribbon(g, foam, 0.06, "#d2e1c4");
      for (let side of [-1, 1])
        for (let j = 0; j < 25; j++) {
          const x = side * (10 + rand() * 10),
            z = (rand() - 0.5) * 50;
          pine(g, x, fn(x, z), z, 0.5 + rand() * 0.5);
        }
      const upper = [];
      for (let z = -30; z <= -11; z += 0.5)
        upper.push([Math.sin((z + 11) * 0.11) * 2, 7.13, z]);
      ribbon(g, upper, 1, "#6b9e9d");
      const fall = mesh(
        new T.PlaneGeometry(2.1, 8.0, 10, 35),
        mat("#e6f1dc", {
          side: T.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        0,
        3.12,
        -10.62,
      );
      g.add(fall);
      for (let j = 0; j < 8; j++) {
        const thin = mesh(
          new T.PlaneGeometry(0.06 + rand() * 0.12, 8.0),
          mat(j % 2 ? "#9ac4bb" : "#f4f5e4", {
            transparent: true,
            opacity: 0.65,
          }),
          -0.94 + j * 0.27,
          3.12,
          -10.6,
        );
        g.add(thin);
      }
      for (let j = 0; j < 8; j++) {
        const p = new T.Sprite(
          new T.SpriteMaterial({
            map: steam,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
          }),
        );
        p.position.set((rand() - 0.5) * 3, 0.2 + rand() * 1.4, -10);
        p.scale.set(3, 2, 1);
        g.add(p);
        animated.push({ o: p, type: "mist", base: p.position.clone(), j });
      }
    }
    if (i === 3) {
      const fn = (x, z) =>
        -0.4 + Math.sin(x * 0.08 + z * 0.04) * 0.8 + Math.max(0, -z - 9) * 0.06;
      terrain(g, 70, 70, fn, "#a5a86a");
      const pts = [];
      for (let z = -31; z <= 28; z += 0.6) {
        const x = 5 + Math.sin(z * 0.14) * 4;
        pts.push([x, fn(x, z) + 0.05, z]);
      }
      ribbon(g, pts, 0.75, "#678f8c");
      for (let j = 0; j < 60; j++) {
        const x = (rand() - 0.5) * 60,
          z = (rand() - 0.5) * 60;
        for (let k = 0; k < 2; k++) {
          const blade = mesh(
            new T.ConeGeometry(0.03, 0.3 + rand() * 0.2, 3),
            mat("#8c9458"),
            x + k * 0.1,
            fn(x, z) + 0.2,
            z,
          );
          g.add(blade);
        }
      }
      const herd = [
        [-2, 2, 1.45],
        [2, 5, 1.2],
        [-6, -2, 1.1],
        [1, -4, 0.9],
        [-8, -7, 0.7],
      ];
      for (const [x, z, s] of herd) bison(g, x, fn(x, z), z, s);
      for (let j = 0; j < 18; j++) {
        const x = -20 + rand() * 10,
          z = -15 - rand() * 12;
        pine(g, x, fn(x, z), z, 0.7 + rand() * 0.7);
      }
    }
    if (i === 4) {
      const fn = (x, z) => {
        const r = Math.sqrt(x * x + z * z);
        return (
          -0.4 +
          Math.pow(Math.max(0, r - 8) / 16, 1.5) * 5 +
          0.24 * Math.sin(x * 0.3) * Math.cos(z * 0.3)
        );
      };
      terrain(g, 65, 65, fn, "#8e9a70", 130);
      const lg = new T.CircleGeometry(9, 128);
      const la = lg.attributes.position;
      for (let k = 1; k < la.count; k++) {
        const a = Math.atan2(la.getY(k), la.getX(k)),
          v = 1 + 0.06 * Math.sin(a * 5) + 0.04 * Math.sin(a * 9);
        la.setX(k, la.getX(k) * v);
        la.setY(k, la.getY(k) * v);
      }
      const lake = mesh(
        lg,
        mat("#4f8d95", { roughness: 0.28, metalness: 0.1 }),
        0,
        -0.08,
        -1,
      );
      lake.rotation.x = -Math.PI / 2;
      lake.scale.y = 0.7;
      g.add(lake);
      for (let j = 0; j < 190; j++) {
        const a = rand() * Math.PI * 2,
          r = 10 + rand() * 18,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        pine(g, x, fn(x, z), z, 0.4 + rand() * 0.7);
      }
      for (let j = 0; j < 20; j++) {
        const a = rand() * Math.PI * 2,
          r = 9 + rand() * 3,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        ell(g, "#a8a282", [x, fn(x, z), z], [0.7, 0.25, 0.5], 12);
      }
    }
  }
  for (const root of scenes) {
    root.updateMatrixWorld(true);
    const batches = new Map(),
      remove = [];
    root.traverse((o) => {
      if (!o.isMesh || o.material.isShaderMaterial) return;
      const m = o.material,
        key = JSON.stringify([
          m.color?.getHex(),
          m.roughness,
          m.metalness,
          m.side,
          m.vertexColors,
          m.transparent,
          m.opacity,
          m.polygonOffset,
          Object.keys(o.geometry.attributes).sort(),
          o.castShadow,
          o.receiveShadow,
        ]);
      if (!batches.has(key))
        batches.set(key, {
          m,
          gs: [],
          cast: o.castShadow,
          receive: o.receiveShadow,
        });
      batches.get(key).gs.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
      remove.push(o);
    });
    for (const o of remove) o.removeFromParent();
    for (const b of batches.values()) {
      const merged = mergeGeometries(b.gs);
      if (!merged) throw Error("Static geometry merge failed");
      const o = new T.Mesh(merged, b.m);
      o.castShadow = b.cast;
      o.receiveShadow = b.receive;
      root.add(o);
      b.gs.forEach((g) => g.dispose());
    }
  }
  return { scenes, animated, descriptors };
}
function bison(parent, x, y, z, s) {
  const g = new T.Group();
  g.position.set(x, y + 0.1, z);
  g.scale.setScalar(s);
  g.rotation.y = 1.15;
  const dark = "#493c2e",
    shag = "#3c3126";
  ell(g, dark, [0, 0.95, 0], [1.3, 0.7, 0.55]);
  ell(g, shag, [-0.65, 1.25, 0], [0.8, 0.8, 0.63]);
  ell(g, shag, [-1.35, 0.88, 0], [0.48, 0.52, 0.48]);
  ell(g, "#2b2921", [-1.68, 0.73, 0], [0.25, 0.22, 0.32]);
  for (const xx of [-0.72, 0.77])
    for (const zz of [-0.32, 0.32]) {
      cylinder(g, dark, 0.12, 0.08, 0.82, [xx, 0.42, zz]);
      ell(g, "#292a24", [xx, 0.06, zz], [0.15, 0.09, 0.16], 12);
    }
  for (const side of [-1, 1]) {
    const horn = mesh(
      new T.TorusGeometry(0.25, 0.065, 8, 12, 2),
      mat("#d5cab1"),
      -1.3,
      1.16,
      side * 0.44,
    );
    horn.rotation.x = (side * Math.PI) / 2;
    horn.rotation.z = -0.3;
    g.add(horn);
    ell(g, "#171c18", [-1.62, 1.01, side * 0.28], [0.035, 0.035, 0.025], 10);
    ell(g, dark, [-1.18, 1.22, side * 0.49], [0.16, 0.1, 0.17], 12);
  }
  const beard = mesh(
    new T.ConeGeometry(0.19, 0.58, 12),
    mat(shag),
    -1.37,
    0.45,
    0,
  );
  beard.rotation.z = Math.PI;
  g.add(beard);
  for (let k = 0; k < 40; k++) {
    const a = rand() * Math.PI * 2;
    ell(
      g,
      k % 2 ? dark : shag,
      [-0.8 + (rand() - 0.5) * 0.8, 1.45 + rand() * 0.35, Math.sin(a) * 0.45],
      [0.1, 0.12, 0.1],
      8,
    );
  }
  const tail = cylinder(g, dark, 0.04, 0.03, 0.66, [1.2, 0.7, 0.02]);
  tail.rotation.z = 0.35;
  ell(g, shag, [1.3, 0.34, 0.02], [0.09, 0.17, 0.1], 10);
  parent.add(g);
}
