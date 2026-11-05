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

	// Small WebGL 2 helpers shared by the space passes.
	
	function compileShader(gl, type, source) {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
		console.warn('space shader:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	
	function createProgram(gl, vertexSource, fragmentSource) {
		const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
		const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
	
	function bindTriangle(gl, buffer, program) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		const position = gl.getAttribLocation(program, 'a_pos');
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
		return vao;
	}
	
	function ensureTarget(gl, target, width, height) {
		if (!target) {
			target = {
				texture: gl.createTexture(),
				framebuffer: gl.createFramebuffer(),
				width: 0,
				height: 0,
			};
		}
	
		gl.bindTexture(gl.TEXTURE_2D, target.texture);
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
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			target.texture,
			0,
		);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
		target.width = width;
		target.height = height;
		return target;
	}

	app.spaceGl = {
		compileShader: compileShader,
		createProgram: createProgram,
		bindTriangle: bindTriangle,
		ensureTarget: ensureTarget,
	};
})(window.Lucyd = window.Lucyd || {});
