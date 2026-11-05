/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

(function (app) {
	'use strict';

	// Dithered nebula. Rendered at a reduced resolution and blitted up, which is
	// what gives the wallpaper its grainy, posterised look.
	
	const nebulaFragmentSource = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform vec3 u_primary;
uniform vec3 u_secondary;

out vec4 fragColor;

const float DEPTH = 2.7;
const float WARP = 1.6;
const float SWAY = 0.38;
const float GLOW = 0.04;
const float DIM = 0.9;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.05;
    amp *= 0.52;
  }
  return v;
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float nebula(vec2 p, float t, float seed) {
  vec2 q = vec2(
    fbm(p * 0.9 + vec2(sin(t * 0.23 + seed), cos(t * 0.19) * 0.8) + seed),
    fbm(p * 0.9 + vec2(cos(t * 0.17), sin(t * 0.21 + seed) * 0.8) + seed + 7.3)
  );

  vec2 r = vec2(
    fbm(p + q * WARP + vec2(sin(t * 0.11) * SWAY, cos(t * 0.13) * SWAY) + seed + 2.1),
    fbm(p + q * WARP + vec2(cos(t * 0.09) * SWAY, sin(t * 0.12) * SWAY) + seed + 9.7)
  );

  return fbm(p + r * WARP * 1.15 + vec2(seed * 3.1));
}

float ridge(vec2 p, float seed) {
  float n = fbm(p + seed * 4.7);
  return 1.0 - abs(2.0 * n - 1.0);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / u_res;
  float aspect = u_res.x / u_res.y;
  float ref = max(aspect, 1.0);
  vec2 p = (uv - vec2(0.37, 0.5)) * vec2(ref, ref / aspect) * DEPTH;
  p.y += u_scroll * 0.0006;

  float t = u_time;

  float back = nebula(p * 0.55 + 13.0, t * 0.5, 4.0);
  float front = nebula(p, t, 0.0);

  float lane = smoothstep(0.7, 0.92, ridge(p * 2.1 + vec2(sin(t * 0.08), 0.0), 3.0));
  float thread = smoothstep(0.88, 0.99, ridge(p * 4.6 + vec2(0.0, cos(t * 0.11)), 8.0));
  float gas = smoothstep(0.5, 0.62, front);

  float sv = smoothstep(0.5, 0.62, back) * (0.45 + 0.5 * lane);
  float sp = gas * (0.15 + 0.85 * lane) + gas * 0.45 * thread;

  float d1 = mix(bayer4(fc), hash(fc + vec2(0.5, 1.5)), 0.3);
  float d2 = mix(bayer4(fc + vec2(2.0, 2.0)), hash(fc * 1.13 + vec2(17.0, 4.0)), 0.3);

  float dotsV = step(d1, clamp(sv, 0.0, 1.0) * 0.5);
  float dotsP = step(d2, clamp(sp, 0.0, 1.0) * 0.6);

  vec3 bg = vec3(0.026, 0.010, 0.040);
  vec3 violet = mix(vec3(0.229, 0.127, 0.331), u_primary * 0.35, 0.8);
  vec3 pink = mix(vec3(0.531, 0.245, 0.442), u_secondary * 0.4, 0.8);

  vec3 col = bg;
  col += violet * clamp(sv, 0.0, 1.0) * GLOW;
  col += pink * clamp(sp, 0.0, 1.0) * GLOW * 0.85;
  col = mix(col, violet, dotsV * 0.72);
  col = mix(col, pink, dotsP * 0.6);

  float vig = smoothstep(1.5, 0.18, length(uv - vec2(0.37, 0.5)) * 1.5);
  col *= 0.55 + 0.45 * vig;
  col *= DIM;
  col = clamp(col, 0.0, 1.0);

  fragColor = vec4(col, 1.0);
}
`;

	Object.assign((app.spaceShaders = app.spaceShaders || {}), {
		nebulaFragmentSource: nebulaFragmentSource,
	});
})(window.Lucyd = window.Lucyd || {});
