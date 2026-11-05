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

	const { registerLoop } = app.loop;
	const { create: createBloomPrograms } = app.matrixGlowPrograms;
	const { resize: resizeTargets } = app.matrixGlowTargets;

	// Bloom post-process for the matrix canvas: bright pass, separable blur,
	// additive output on a layer below the sharp glyphs.
	
	
	const GLOW = {
		scale: 2,
		threshold: 0.03,
		intensity: 6.0,
		radius: 1.3,
	};
	
	function initMatrixGlow() {
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
	
		const bloom = createBloomPrograms(gl);
		if (!bloom) {
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
	
		const sourceTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	
		let targets = { a: null, b: null };
	
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
			targets = resizeTargets(gl, targets, targetWidth, targetHeight);
	
			glowCanvas.style.display = targets.a && targets.b ? '' : 'none';
		}
	
		function drawMatrixGlow() {
			if (
				!targets.a ||
				!targets.b ||
				matrixCanvas.width !== glowCanvas.width ||
				matrixCanvas.height !== glowCanvas.height
			) {
				resizeGlow();
			}
			if (!targets.a || !targets.b) return;
	
			gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				matrixCanvas,
			);
	
			gl.bindFramebuffer(gl.FRAMEBUFFER, targets.a.framebuffer);
			gl.viewport(0, 0, targets.a.width, targets.a.height);
			gl.useProgram(bloom.bright);
			gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
			gl.uniform1i(bloom.uniforms.bright.source, 0);
			gl.uniform1f(bloom.uniforms.bright.threshold, GLOW.threshold);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			gl.bindFramebuffer(gl.FRAMEBUFFER, targets.b.framebuffer);
			gl.viewport(0, 0, targets.b.width, targets.b.height);
			gl.useProgram(bloom.blur);
			gl.bindTexture(gl.TEXTURE_2D, targets.a.texture);
			gl.uniform1i(bloom.uniforms.blur.image, 0);
			gl.uniform2f(bloom.uniforms.blur.direction, GLOW.radius / targets.a.width, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			gl.bindFramebuffer(gl.FRAMEBUFFER, targets.a.framebuffer);
			gl.viewport(0, 0, targets.a.width, targets.a.height);
			gl.useProgram(bloom.blur);
			gl.bindTexture(gl.TEXTURE_2D, targets.b.texture);
			gl.uniform1i(bloom.uniforms.blur.image, 0);
			gl.uniform2f(bloom.uniforms.blur.direction, 0, GLOW.radius / targets.b.height);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, glowCanvas.width, glowCanvas.height);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(bloom.composite);
			gl.bindTexture(gl.TEXTURE_2D, targets.a.texture);
			gl.uniform1i(bloom.uniforms.composite.image, 0);
			gl.uniform1f(bloom.uniforms.composite.intensity, GLOW.intensity);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
	
		resizeGlow();
	
		if (typeof ResizeObserver !== 'undefined') {
			new ResizeObserver(resizeGlow).observe(matrixCanvas);
		} else {
			window.addEventListener('resize', resizeGlow);
		}
	
		registerLoop('matrixGlow', drawMatrixGlow);
	}

	app.matrixGlow = {
		init: initMatrixGlow,
	};
})(window.Lucyd = window.Lucyd || {});
