/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Nebula, stars and shooting stars behind the wallpaper. Ported from the
// lucydcoded.de space scene: the nebula renders into a CSS-sized target and is
// blitted up, stars are generated from their vertex id, and the meteors work
// out their own schedule from the time uniform.

const spaceVertexSource = `#version 300 es

in vec2 a_pos;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

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

const blitFragmentSource = `#version 300 es
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_screen;

out vec4 fragColor;

void main() {
  fragColor = texture(u_tex, gl_FragCoord.xy / u_screen);
}
`;

const spaceCanvas = document.getElementById('space');
const spaceOverlay = document.querySelector('.overlay');

if (spaceCanvas) {
	const gl = spaceCanvas.getContext('webgl2', {
		antialias: false,
		alpha: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
	});

	if (!gl) {
		spaceCanvas.style.display = 'none';
	} else {
		startSpaceScene(gl);
	}
}

function startSpaceScene(gl) {
	function compileShader(type, source) {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
		console.warn('space shader:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	function createProgram(vertexSource, fragmentSource) {
		const vertex = compileShader(gl.VERTEX_SHADER, vertexSource);
		const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
		if (!vertex || !fragment) return null;

		const program = gl.createProgram();
		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn('space program:', gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}
		return program;
	}

	const starProgram = createProgram(starVertexSource, starFragmentSource);
	const meteorProgram = createProgram(spaceVertexSource, meteorFragmentSource);
	const nebulaProgram = createProgram(spaceVertexSource, nebulaFragmentSource);
	const blitProgram = createProgram(spaceVertexSource, blitFragmentSource);
	if (!starProgram || !meteorProgram || !nebulaProgram || !blitProgram) {
		spaceCanvas.style.display = 'none';
		return;
	}

	const loc = (program, name) => gl.getUniformLocation(program, name);

	const starUniforms = {
		res: loc(starProgram, 'u_res'),
		time: loc(starProgram, 'u_time'),
		scroll: loc(starProgram, 'u_scroll'),
		dpr: loc(starProgram, 'u_dpr'),
	};
	const nebulaUniforms = {
		res: loc(nebulaProgram, 'u_res'),
		time: loc(nebulaProgram, 'u_time'),
		scroll: loc(nebulaProgram, 'u_scroll'),
		primary: loc(nebulaProgram, 'u_primary'),
		secondary: loc(nebulaProgram, 'u_secondary'),
	};
	const blitUniforms = {
		tex: loc(blitProgram, 'u_tex'),
		screen: loc(blitProgram, 'u_screen'),
	};
	const meteorUniforms = {
		res: loc(meteorProgram, 'u_res'),
		time: loc(meteorProgram, 'u_time'),
	};

	const triangle = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 3, -1, -1, 3]),
		gl.STATIC_DRAW,
	);

	const starVao = gl.createVertexArray();

	function bindTriangle(program) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
		const position = gl.getAttribLocation(program, 'a_pos');
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
		return vao;
	}

	const nebulaVao = bindTriangle(nebulaProgram);
	const blitVao = bindTriangle(blitProgram);
	const meteorVao = bindTriangle(meteorProgram);

	const fbo = gl.createFramebuffer();
	const nebulaTex = gl.createTexture();
	let nebulaWidth = 0;
	let nebulaHeight = 0;
	let starCount = 0;
	let dpr = 1;
	let startedAt = performance.now();

	function makeTarget(width, height) {
		gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA8,
			width,
			height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			nebulaTex,
			0,
		);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		nebulaWidth = width;
		nebulaHeight = height;
	}

	let lastPrimary = '';
	let lastSecondary = '';
	let primaryColor = [0.63, 0.14, 1];
	let secondaryColor = [1, 0, 0.9];

	function readColor(value) {
		const parts = String(value || '')
			.trim()
			.split(/\s+/)
			.map(Number);
		return [
			Number.isFinite(parts[0]) ? parts[0] : 0,
			Number.isFinite(parts[1]) ? parts[1] : 0,
			Number.isFinite(parts[2]) ? parts[2] : 0,
		];
	}

	function drawSpace() {
		if (PROPS.general.primary !== lastPrimary) {
			lastPrimary = PROPS.general.primary;
			primaryColor = readColor(lastPrimary);
		}
		if (PROPS.general.secondary !== lastSecondary) {
			lastSecondary = PROPS.general.secondary;
			secondaryColor = readColor(lastSecondary);
		}

		const seconds = (performance.now() - startedAt) / 1000;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.viewport(0, 0, nebulaWidth, nebulaHeight);
		gl.disable(gl.BLEND);
		gl.useProgram(nebulaProgram);
		gl.bindVertexArray(nebulaVao);
		gl.uniform2f(nebulaUniforms.res, nebulaWidth, nebulaHeight);
		gl.uniform1f(nebulaUniforms.time, seconds);
		gl.uniform1f(nebulaUniforms.scroll, 0);
		gl.uniform3f(
			nebulaUniforms.primary,
			primaryColor[0],
			primaryColor[1],
			primaryColor[2],
		);
		gl.uniform3f(
			nebulaUniforms.secondary,
			secondaryColor[0],
			secondaryColor[1],
			secondaryColor[2],
		);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, spaceCanvas.width, spaceCanvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(blitProgram);
		gl.bindVertexArray(blitVao);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
		gl.uniform1i(blitUniforms.tex, 0);
		gl.uniform2f(blitUniforms.screen, spaceCanvas.width, spaceCanvas.height);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		gl.blendFunc(gl.ONE, gl.ONE);
		gl.useProgram(starProgram);
		gl.bindVertexArray(starVao);
		gl.uniform2f(starUniforms.res, spaceCanvas.width, spaceCanvas.height);
		gl.uniform1f(starUniforms.time, seconds);
		gl.uniform1f(starUniforms.scroll, 0);
		gl.uniform1f(starUniforms.dpr, dpr);
		gl.drawArrays(gl.POINTS, 0, starCount);

		{
			gl.useProgram(meteorProgram);
			gl.bindVertexArray(meteorVao);
			gl.uniform2f(meteorUniforms.res, spaceCanvas.width, spaceCanvas.height);
			gl.uniform1f(meteorUniforms.time, seconds);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		gl.bindVertexArray(null);
	}

	function resizeSpace() {
		const rect = spaceCanvas.getBoundingClientRect();
		const width = Math.max(1, rect.width);
		const height = Math.max(1, rect.height);

		dpr = Math.min(window.devicePixelRatio || 1, 2);
		spaceCanvas.width = Math.round(width * dpr);
		spaceCanvas.height = Math.round(height * dpr);
		starCount = Math.min(
			2600,
			Math.max(240, Math.round((width * height) / 1800)),
		);

		const nebulaScale = Math.min(1, 1920 / width);
		makeTarget(
			Math.max(1, Math.round(width * nebulaScale)),
			Math.max(1, Math.round(height * nebulaScale)),
		);

	}

	resizeSpace();

	if (typeof ResizeObserver !== 'undefined' && spaceOverlay) {
		let resizeTimer = 0;
		new ResizeObserver(() => {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(resizeSpace, 150);
		}).observe(spaceOverlay);
	} else {
		window.addEventListener('resize', resizeSpace);
	}

	registerLoop('space', drawSpace);
}
