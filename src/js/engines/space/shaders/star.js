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

	// Stars are generated from their vertex id; no buffers, no uploads.
	
	const starVertexSource = `#version 300 es

uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_dpr;

const float SIZE_SCALE = 2.53;
const float GAIN = 1.6;

out vec3 v_tint;
out float v_alpha;
out float v_spike;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec3 tintFor(float r) {
  if (r < 0.34) return vec3(0.82, 0.88, 1.0);
  if (r < 0.64) return vec3(1.0, 1.0, 1.0);
  if (r < 0.82) return vec3(1.0, 0.9, 0.78);
  if (r < 0.94) return vec3(0.88, 0.8, 1.0);
  return vec3(0.72, 0.92, 1.0);
}

void main() {
  float id = float(gl_VertexID) + 1.0;

  float size = 0.4 + pow(hash11(id * 4.13), 2.4) * 1.8;
  float bright = hash11(id * 9.71);
  float base = 0.14 + pow(bright, 2.1) * 0.72;
  float phase = hash11(id * 6.37) * 6.2831853;
  float speed = 0.35 + hash11(id * 7.19) * 1.15;
  float depth = 0.4 + hash11(id * 8.53) * 1.2;

  float x = hash11(id * 1.07);
  float y;
  if (hash11(id * 3.31) < 0.38) {
    y = fract(0.82 - 0.46 * x + (hash11(id * 2.29) - 0.5) * 0.14);
  } else {
    y = hash11(id * 2.29);
  }

  float twinkle = 0.7 + 0.3 * sin(u_time * speed + phase);
  x = fract(x + (u_time * 1.6 * depth) / u_res.x);
  y = fract(y - (u_scroll * 0.04 * depth) / u_res.y);

  gl_Position = vec4(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  gl_PointSize = size * u_dpr * SIZE_SCALE;

  v_tint = tintFor(hash11(id * 5.61));
  v_alpha = base * twinkle * GAIN;
  v_spike = bright < 0.06 && size > 1.1 ? 0.35 + hash11(id * 10.3) * 0.5 : 0.0;
}
`;
	
	const starFragmentSource = `#version 300 es
precision highp float;

in vec3 v_tint;
in float v_alpha;
in float v_spike;

out vec4 fragColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);

  float core = smoothstep(0.85, 0.0, d);
  float halo = pow(max(0.0, 1.0 - d), 4.5);
  float a = core * 0.8 + halo * 0.35;

  float spikeX = smoothstep(0.1, 0.0, abs(p.x)) * smoothstep(0.95, 0.25, abs(p.y));
  float spikeY = smoothstep(0.1, 0.0, abs(p.y)) * smoothstep(0.95, 0.25, abs(p.x));
  a += (spikeX + spikeY) * v_spike;

  a = clamp(a, 0.0, 1.0) * v_alpha;
  fragColor = vec4(v_tint * a, a);
}
`;

	Object.assign((app.spaceShaders = app.spaceShaders || {}), {
		starVertexSource: starVertexSource,
		starFragmentSource: starFragmentSource,
	});
})(window.Lucyd = window.Lucyd || {});
