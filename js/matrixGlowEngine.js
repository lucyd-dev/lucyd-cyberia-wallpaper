/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Bloom post-process for the matrix canvas: bright pass, separable blur,
// additive output on a layer below the sharp glyphs.

(() => {
	const GLOW = {
		scale: 2,
		threshold: 0.03,
		intensity: 6.0,
		radius: 1.3,
	};

	const matrixCanvas = document.getElementById('matrix');
	const glowCanvas = document.getElementById('matrixGlow');
	if (!matrixCanvas || !glowCanvas) return;

	const gl = glowCanvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: false,
	});

	if (!gl) {
		glowCanvas.style.display = 'none';
		return;
	}

	const vertexSource = `
		attribute vec2 position;
		varying vec2 v_uv;

		void main() {
			v_uv = position * 0.5 + 0.5;
			gl_Position = vec4(position, 0.0, 1.0);
		}
	`;

	const brightSource = `
		precision highp float;
		varying vec2 v_uv;
		uniform sampler2D u_source;
		uniform float u_threshold;

		void main() {
			vec3 color = texture2D(u_source, v_uv).rgb;
			float luminance = dot(color, vec3(0.299, 0.587, 0.114));
			float bright = smoothstep(u_threshold, u_threshold + 0.35, luminance);
			gl_FragColor = vec4(color * bright, 1.0);
		}
	`;

	const blurSource = `
		precision highp float;
		varying vec2 v_uv;
		uniform sampler2D u_image;
		uniform vec2 u_direction;

		void main() {
			vec3 sum = texture2D(u_image, v_uv).rgb * 0.227027;
			sum += texture2D(u_image, v_uv + u_direction * 1.0).rgb * 0.1945946;
			sum += texture2D(u_image, v_uv - u_direction * 1.0).rgb * 0.1945946;
			sum += texture2D(u_image, v_uv + u_direction * 2.0).rgb * 0.1216216;
			sum += texture2D(u_image, v_uv - u_direction * 2.0).rgb * 0.1216216;
			sum += texture2D(u_image, v_uv + u_direction * 3.0).rgb * 0.054054;
			sum += texture2D(u_image, v_uv - u_direction * 3.0).rgb * 0.054054;
			sum += texture2D(u_image, v_uv + u_direction * 4.0).rgb * 0.016216;
			sum += texture2D(u_image, v_uv - u_direction * 4.0).rgb * 0.016216;
			gl_FragColor = vec4(sum, 1.0);
		}
	`;

	const compositeSource = `
		precision highp float;
		varying vec2 v_uv;
		uniform sampler2D u_image;
		uniform float u_intensity;

		void main() {
			gl_FragColor = vec4(texture2D(u_image, v_uv).rgb * u_intensity, 1.0);
		}
	`;

	function compileShader(type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.warn('matrixGlow shader:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function createProgram(fragmentSource) {
		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
		if (!vertexShader || !fragmentShader) return null;

		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.bindAttribLocation(program, 0, 'position');
		gl.linkProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn('matrixGlow program:', gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}

		return program;
	}

	const brightProgram = createProgram(brightSource);
	const blurProgram = createProgram(blurSource);
	const compositeProgram = createProgram(compositeSource);

	if (!brightProgram || !blurProgram || !compositeProgram) {
		glowCanvas.style.display = 'none';
		return;
	}

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW,
	);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	gl.activeTexture(gl.TEXTURE0);

	const brightUniforms = {
		source: gl.getUniformLocation(brightProgram, 'u_source'),
		threshold: gl.getUniformLocation(brightProgram, 'u_threshold'),
	};
	const blurUniforms = {
		image: gl.getUniformLocation(blurProgram, 'u_image'),
		direction: gl.getUniformLocation(blurProgram, 'u_direction'),
	};
	const compositeUniforms = {
		image: gl.getUniformLocation(compositeProgram, 'u_image'),
		intensity: gl.getUniformLocation(compositeProgram, 'u_intensity'),
	};

	const sourceTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

	let targetA = null;
	let targetB = null;

	function createTarget(width, height) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			width,
			height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0,
		);

		if (
			gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
		) {
			console.warn('matrixGlow framebuffer incomplete');
			gl.deleteFramebuffer(framebuffer);
			gl.deleteTexture(texture);
			return null;
		}

		return { texture, framebuffer, width, height };
	}

	function destroyTarget(target) {
		if (!target) return;
		gl.deleteFramebuffer(target.framebuffer);
		gl.deleteTexture(target.texture);
	}

	function resizeGlow() {
		const width = matrixCanvas.width;
		const height = matrixCanvas.height;
		if (!width || !height) return;

		if (glowCanvas.width !== width || glowCanvas.height !== height) {
			glowCanvas.width = width;
			glowCanvas.height = height;
		}

		const targetWidth = Math.max(1, Math.floor(width / GLOW.scale));
		const targetHeight = Math.max(1, Math.floor(height / GLOW.scale));

		if (
			!targetA ||
			!targetB ||
			targetA.width !== targetWidth ||
			targetA.height !== targetHeight
		) {
			destroyTarget(targetA);
			destroyTarget(targetB);
			targetA = createTarget(targetWidth, targetHeight);
			targetB = createTarget(targetWidth, targetHeight);
		}

		if (!targetA || !targetB) {
			glowCanvas.style.display = 'none';
		} else {
			glowCanvas.style.display = '';
		}
	}

	function drawMatrixGlow() {
		if (
			!targetA ||
			!targetB ||
			matrixCanvas.width !== glowCanvas.width ||
			matrixCanvas.height !== glowCanvas.height
		) {
			resizeGlow();
		}
		if (!targetA || !targetB) return;

		gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			matrixCanvas,
		);

		gl.bindFramebuffer(gl.FRAMEBUFFER, targetA.framebuffer);
		gl.viewport(0, 0, targetA.width, targetA.height);
		gl.useProgram(brightProgram);
		gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
		gl.uniform1i(brightUniforms.source, 0);
		gl.uniform1f(brightUniforms.threshold, GLOW.threshold);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindFramebuffer(gl.FRAMEBUFFER, targetB.framebuffer);
		gl.viewport(0, 0, targetB.width, targetB.height);
		gl.useProgram(blurProgram);
		gl.bindTexture(gl.TEXTURE_2D, targetA.texture);
		gl.uniform1i(blurUniforms.image, 0);
		gl.uniform2f(blurUniforms.direction, GLOW.radius / targetA.width, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindFramebuffer(gl.FRAMEBUFFER, targetA.framebuffer);
		gl.viewport(0, 0, targetA.width, targetA.height);
		gl.useProgram(blurProgram);
		gl.bindTexture(gl.TEXTURE_2D, targetB.texture);
		gl.uniform1i(blurUniforms.image, 0);
		gl.uniform2f(blurUniforms.direction, 0, GLOW.radius / targetB.height);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, glowCanvas.width, glowCanvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(compositeProgram);
		gl.bindTexture(gl.TEXTURE_2D, targetA.texture);
		gl.uniform1i(compositeUniforms.image, 0);
		gl.uniform1f(compositeUniforms.intensity, GLOW.intensity);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	resizeGlow();

	if (typeof ResizeObserver !== 'undefined') {
		new ResizeObserver(resizeGlow).observe(matrixCanvas);
	} else {
		window.addEventListener('resize', resizeGlow);
	}

	registerLoop('matrixGlow', drawMatrixGlow);
})();
