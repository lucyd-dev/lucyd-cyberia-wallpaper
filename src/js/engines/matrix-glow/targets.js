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

	// Offscreen render targets for the bloom ping-pong.
	
	function createTarget(gl, width, height) {
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
	
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			console.warn('matrixGlow framebuffer incomplete');
			gl.deleteFramebuffer(framebuffer);
			gl.deleteTexture(texture);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			return null;
		}
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
		return { texture, framebuffer, width, height };
	}
	
	function destroyTarget(gl, target) {
		if (!target) return;
		gl.deleteFramebuffer(target.framebuffer);
		gl.deleteTexture(target.texture);
	}
	
	function resizeTargets(gl, pair, width, height) {
		if (
			pair.a &&
			pair.b &&
			pair.a.width === width &&
			pair.a.height === height
		) {
			return pair;
		}
	
		destroyTarget(gl, pair.a);
		destroyTarget(gl, pair.b);
	
		return {
			a: createTarget(gl, width, height),
			b: createTarget(gl, width, height),
		};
	}

	app.matrixGlowTargets = {
		resize: resizeTargets,
	};
})(window.Lucyd = window.Lucyd || {});
