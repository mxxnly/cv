/**
 * Procedural moon in two passes:
 *  1. MAP  — bakes an equirectangular surface map once (16-bit height in RG, albedo in B).
 *  2. MOON — every frame: projects the map on a sphere, bump-maps it and lights it by phase.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const PRECISION = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

export const MAP_SHADER = /* glsl */ `${PRECISION}
varying vec2 vUv;
uniform float uSeed;

const float PI = 3.141592653589793;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * noise(p);
    p = p * 2.03 + vec3(17.3, 9.1, 4.7);
    amp *= 0.5;
  }
  return sum;
}

// One octave of craters: a 3D cellular field, sliced by the sphere surface.
float craters(vec3 p, float density, inout float ejecta) {
  vec3 cell = floor(p);
  vec3 local = fract(p);
  float h = 0.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 id = cell + offset + uSeed;
        vec3 rnd = hash33(id);
        if (rnd.x > density) continue;
        vec3 center = offset + 0.25 + 0.5 * hash33(id * 1.73 + 11.0);
        float radius = 0.1 + 0.32 * rnd.y * rnd.y;
        float d = length(local - center) / radius;
        if (d > 2.5) continue;
        float fade = 1.0 - smoothstep(1.9, 2.5, d);
        float bowl = d < 1.0 ? max(d * d - 1.0, -0.6) : 0.0;
        float rim = 0.36 * exp(-pow((d - 1.0) * 4.2, 2.0));
        float apron = d > 1.0 ? 0.09 * exp(-(d - 1.0) * 2.4) * fade : 0.0;
        h += (bowl + rim + apron) * radius;
        float young = step(0.84, fract(rnd.z * 7.31));
        ejecta = max(ejecta, young * exp(-max(d - 0.8, 0.0) * 1.5) * fade);
      }
    }
  }
  return h;
}

void main() {
  float lon = (vUv.x - 0.5) * 2.0 * PI;
  float lat = (vUv.y - 0.5) * PI;
  vec3 p = vec3(sin(lon) * cos(lat), sin(lat), cos(lon) * cos(lat));

  // Maria: large dark basaltic plains — smooth, with far fewer small craters.
  float maria = smoothstep(0.47, 0.56, fbm(p * 0.95 + vec3(3.1, 7.7, 1.9)));
  float smooth1 = mix(1.0, 0.6, maria);
  float smooth2 = mix(1.0, 0.3, maria);

  float ejecta = 0.0;
  float h = 0.0;
  h += craters(p * 2.2, 0.4, ejecta);
  h += craters(p * 4.8 + 13.0, 0.42, ejecta) * 0.55 * smooth1;
  h += craters(p * 10.0 + 29.0, 0.3, ejecta) * 0.3 * smooth2;
  h += craters(p * 21.0 + 51.0, 0.24, ejecta) * 0.16 * smooth2;
  h += (fbm(p * 16.0) - 0.48) * 0.025;
  h -= maria * 0.03;

  float highlands = 0.74 + (fbm(p * 2.6 + 5.0) - 0.48) * 0.32;
  float mare = 0.3 + (fbm(p * 5.0 + 2.0) - 0.48) * 0.16;
  float albedo = clamp(mix(highlands, mare, maria) + ejecta * 0.26, 0.0, 1.0);

  float encoded = clamp(h * 0.9 + 0.5, 0.0, 1.0);
  float hi = floor(encoded * 255.0) / 255.0;
  float lo = fract(encoded * 255.0);
  gl_FragColor = vec4(hi, lo, albedo, 1.0);
}
`

export const MOON_SHADER = /* glsl */ `${PRECISION}
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uMapSize;
uniform float uPixels;
uniform float uPhase;
uniform vec2 uLibration;
uniform float uDay;
uniform float uReveal;

const float PI = 3.141592653589793;
const float RADIUS = 0.7;

vec3 rotY(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 rotX(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}

float heightAt(vec2 uv) {
  vec4 t = texture2D(uMap, uv);
  return t.r + t.g / 255.0;
}

void main() {
  vec2 q = vUv * 2.0 - 1.0;
  vec2 p = q / RADIUS;
  float r = length(p);
  float px = 2.0 / (uPixels * RADIUS);
  float disc = 1.0 - smoothstep(1.0 - px * 1.5, 1.0 + px * 0.5, r);

  vec3 light = normalize(vec3(sin(uPhase), 0.08, -cos(uPhase)));
  float litFraction = 0.5 - 0.5 * cos(uPhase);

  vec3 color = vec3(0.0);
  float alpha = 0.0;

  if (r < 1.0 + px) {
    float z = sqrt(max(1.0 - r * r, 0.0));
    vec3 viewNormal = vec3(p, z);
    vec3 n0 = rotX(rotY(viewNormal, uLibration.x), uLibration.y);
    vec3 l = rotX(rotY(light, uLibration.x), uLibration.y);
    vec3 v = rotX(rotY(vec3(0.0, 0.0, 1.0), uLibration.x), uLibration.y);

    float lon = atan(n0.x, n0.z);
    float lat = asin(clamp(n0.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);
    vec2 texel = 1.0 / uMapSize;

    vec4 surface = texture2D(uMap, uv);
    float cosLat = max(cos(lat), 0.25);
    float gx = (heightAt(uv + vec2(texel.x, 0.0)) - heightAt(uv - vec2(texel.x, 0.0)))
      / (4.0 * PI * texel.x * cosLat);
    float gy = (heightAt(uv + vec2(0.0, texel.y)) - heightAt(uv - vec2(0.0, texel.y)))
      / (2.0 * PI * texel.y);

    vec3 east = normalize(vec3(n0.z, 0.0, -n0.x) + vec3(1e-5, 0.0, 0.0));
    vec3 north = cross(n0, east);
    vec3 n = normalize(n0 - 0.85 * (gx * east + gy * north));

    float albedo = surface.b;
    float macro = dot(n0, l);
    float mu0 = max(dot(n, l), 0.0);
    float mu = max(dot(n, v), 0.0);
    // Lommel–Seeliger reflectance: the full moon looks flat (relief fades, albedo dominates),
    // while relief pops near the terminator — just like the real one.
    float lommel = mu0 / (mu0 + mu + 0.05) * 1.9;
    float shade = mix(mu0, lommel, 0.72) * smoothstep(-0.06, 0.16, macro);

    vec3 night = albedo * shade * vec3(1.0, 0.975, 0.94) * 1.22;
    night += vec3(0.5, 0.58, 0.85) * albedo * 0.04 * (1.0 - smoothstep(-0.1, 0.25, macro));
    night += vec3(0.62, 0.64, 0.95) * pow(1.0 - z, 4.0) * 0.05;

    float lit = clamp(shade * 1.3, 0.0, 1.0);
    vec3 dayLit = mix(vec3(0.66, 0.69, 0.84), vec3(1.0), clamp(albedo * 1.25, 0.0, 1.0));
    vec3 day = mix(vec3(0.8, 0.82, 0.93), dayLit, lit);
    float dayAlpha = 0.16 + 0.8 * lit;

    float a = mix(1.0, dayAlpha, uDay) * disc;
    color = mix(night, day, uDay) * a;
    alpha = a;
  }

  // Soft halo, stronger the fuller the moon; fades out before the canvas edge.
  float d = max(r - 1.0, 0.0);
  float halo = (exp(-d * 4.5) * (0.06 + 0.26 * litFraction) + exp(-d * 22.0) * 0.16 * litFraction);
  halo *= (1.0 - disc) * (1.0 - smoothstep(0.78, 1.0, length(q)));
  halo *= mix(1.0, 0.6, uDay);
  color += mix(vec3(0.8, 0.78, 1.0), vec3(1.0), uDay) * halo;
  alpha += halo;

  gl_FragColor = vec4(color, min(alpha, 1.0)) * uReveal;
}
`
