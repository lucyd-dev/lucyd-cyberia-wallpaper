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

	const { brightSource, blurSource, compositeSource, vertexSource } = app.matrixGlowShaders;

	function compileShader(gl, type, source) {
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
	
	function createProgram(gl, fragmentSource) {
		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
	
	function createBloomPrograms(gl) {
		const bright = createProgram(gl, brightSource);
		const blur = createProgram(gl, blurSource);
		const composite = createProgram(gl, compositeSource);
		if (!bright || !blur || !composite) return null;
	
		return {
			bright,
			blur,
			composite,
			uniforms: {
				bright: {
					source: gl.getUniformLocation(bright, 'u_source'),
					threshold: gl.getUniformLocation(bright, 'u_threshold'),
				},
				blur: {
					image: gl.getUniformLocation(blur, 'u_image'),
					direction: gl.getUniformLocation(blur, 'u_direction'),
				},
				composite: {
					image: gl.getUniformLocation(composite, 'u_image'),
					intensity: gl.getUniformLocation(composite, 'u_intensity'),
				},
			},
		};
	}

	app.matrixGlowPrograms = {
		create: createBloomPrograms,
	};
})(window.Lucyd = window.Lucyd || {});
