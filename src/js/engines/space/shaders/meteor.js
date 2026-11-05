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

	// Shooting stars. Each cycle decides its own start time, direction and length
	// from the time uniform, so nothing needs to be animated on the CPU.
	
	const meteorFragmentSource = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_time;

out vec4 fragColor;

const float CYCLE = 3.8;

float hash11(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float segment(vec2 p, vec2 a, vec2 b, out float along) {
  vec2 ab = b - a;
  float len2 = max(dot(ab, ab), 1e-5);
  along = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
  return length(p - a - ab * along);
}

void main() {
  float slot = floor(u_time / CYCLE);
  bool first = slot < 0.5;

  float startAt = first ? 0.4 : hash11(slot * 3.17 + 1.3) * CYCLE * 0.55;
  float life = first ? 1.2 : 0.95 + hash11(slot * 5.71 + 4.9) * 0.65;
  float local = u_time - slot * CYCLE - startAt;

  bool empty = !first && hash11(slot * 9.13 + 7.7) > 0.86;

  if (local < 0.0 || local >= life || empty) {
    fragColor = vec4(0.0);
    return;
  }

  float progress = local / life;

  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(gl_FragCoord.x / u_res.x * aspect, gl_FragCoord.y / u_res.y);

  float seed = slot + 1.0;
  float r1 = hash11(seed * 7.13 + 1.7);
  float r2 = hash11(seed * 3.41 + 9.2);
  float r3 = hash11(seed * 5.77 + 4.4);

  float dir = r1 < 0.5 ? 1.0 : -1.0;
  vec2 vel = first
    ? normalize(vec2(0.3, -1.0))
    : normalize(vec2(dir * (0.55 + r3 * 0.85), -(0.45 + r2 * 0.75)));
  vec2 start = first
    ? vec2(aspect * 0.55, 0.98)
    : vec2(aspect * (0.34 + r2 * 0.58), 0.34 + r3 * 0.56);
  float travel = first ? 1.05 : 0.9 + r1 * 0.7;
  vec2 head = start + vel * travel * progress;
  vec2 tail = head - vel * (0.14 + r3 * 0.1);

  float along;
  float dist = segment(p, tail, head, along);

  float width = mix(0.7, 2.2, along) / u_res.y;
  float core = smoothstep(width, 0.0, dist) * pow(along, 2.6);
  float headGlow = exp(-pow(dist * 130.0, 2.0)) * pow(along, 8.0) * 0.4;
  float fade = sin(clamp(progress, 0.0, 1.0) * 3.14159265);

  float alpha = (core + headGlow) * fade * 1.0;
  vec3 color = mix(vec3(0.55, 0.74, 1.0), vec3(1.0, 0.97, 1.0), pow(along, 6.0));

  fragColor = vec4(color * alpha, alpha);
}
`;

	Object.assign((app.spaceShaders = app.spaceShaders || {}), {
		meteorFragmentSource: meteorFragmentSource,
	});
})(window.Lucyd = window.Lucyd || {});
