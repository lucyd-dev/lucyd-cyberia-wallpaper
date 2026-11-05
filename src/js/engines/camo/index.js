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

	const { values: props } = app.props;
	const { numToRGB } = app.color;
	const { registerLoop } = app.loop;
	const { vsSource, fsSource } = app.camoShader;
	const { create: createTargetRegistry } = app.camoTargets;

	// Renders the camouflage shader once and masks every registered element with
	// it. The canvas is never added to the document; it is only a texture source.
	
	
	function initCamoMask() {
		const config = {
			morphSpeed: 0.3,
			scale: 20,
			color1: numToRGB(props.general.primary),
			color2: numToRGB(props.general.secondary),
		};
	
		const glCanvas = document.createElement('canvas');
		const gl = glCanvas.getContext('webgl');
		if (!gl) return;
	
		function resizeEngine() {
			glCanvas.width = window.innerWidth;
			glCanvas.height = window.innerHeight;
			gl.viewport(0, 0, glCanvas.width, glCanvas.height);
		}
		window.addEventListener('resize', resizeEngine);
		resizeEngine();
	
		function createShader(type, source) {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			return shader;
		}
	
		const program = gl.createProgram();
		gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
		gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
		gl.linkProgram(program);
		gl.useProgram(program);
	
		const positionLocation = gl.getAttribLocation(program, 'position');
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW,
		);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	
		const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
		const timeLoc = gl.getUniformLocation(program, 'u_time');
		const color1Loc = gl.getUniformLocation(program, 'u_color1');
		const color2Loc = gl.getUniformLocation(program, 'u_color2');
		const scaleLoc = gl.getUniformLocation(program, 'u_scale');
	
		let shaderTime = 0;
		let lastDrawTime = 0;
		let lastPrimary = '';
		let lastSecondary = '';
	
		const registry = createTargetRegistry();
	
		window.addEventListener('resize', registry.relayout);
	
		if (document.fonts) {
			document.fonts.ready.then(registry.relayout);
		}
	
		registry.register();
	
		registerLoop('camoFilter', drawCamo);
	
		function drawCamo() {
			const now = performance.now();
			const delta = lastDrawTime ? Math.min(now - lastDrawTime, 100) : 0;
			lastDrawTime = now;
			shaderTime += delta * 0.001 * config.morphSpeed;
	
			if (
				props.general.primary !== lastPrimary ||
				props.general.secondary !== lastSecondary
			) {
				lastPrimary = props.general.primary;
				lastSecondary = props.general.secondary;
				config.color1 = numToRGB(lastPrimary);
				config.color2 = numToRGB(lastSecondary);
	
				gl.uniform3f(
					color1Loc,
					config.color1[0] / 255,
					config.color1[1] / 255,
					config.color1[2] / 255,
				);
				gl.uniform3f(
					color2Loc,
					config.color2[0] / 255,
					config.color2[1] / 255,
					config.color2[2] / 255,
				);
			}
	
			gl.uniform2f(resolutionLoc, glCanvas.width, glCanvas.height);
			gl.uniform1f(timeLoc, shaderTime);
			gl.uniform1f(scaleLoc, config.scale);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			registry.targets.forEach((target) => {
				const { canvas, ctx } = target;
				const text = canvas.dataset.text || '';
	
				if (text !== target.text || (text && target.builtText !== text)) {
					target.text = text;
					registry.fit(target);
				}
	
				const svg = canvas.dataset.svg || '';
				if (svg !== target.svg) {
					target.svg = svg;
					target.path = svg ? new Path2D(svg) : null;
				}
	
				const w = canvas.width;
				const h = canvas.height;
	
				ctx.globalCompositeOperation = 'source-over';
				ctx.clearRect(0, 0, w, h);
				ctx.fillStyle = 'white';
	
				if (text) {
					ctx.font = target.fontStr;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(text, w / 2, h / 2);
				}
	
				if (target.path) {
					ctx.fill(target.path);
				}
	
				ctx.globalCompositeOperation = 'source-in';
				ctx.drawImage(glCanvas, target.rect.left, target.rect.top, w, h, 0, 0, w, h);
			});
		}
	}

	app.camo = {
		init: initCamoMask,
	};
})(window.Lucyd = window.Lucyd || {});
