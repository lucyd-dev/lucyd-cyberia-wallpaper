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
	const { bindTriangle, createProgram, ensureTarget } = app.spaceGl;
	const { draw: drawSpace } = app.spaceDraw;
	const {
		quadVertexSource,
		starVertexSource,
		starFragmentSource,
		meteorFragmentSource,
		nebulaFragmentSource,
		blitFragmentSource,
	} = app.spaceShaders;

	// Nebula, stars and shooting stars behind the wallpaper. Ported from the
	// lucydcoded.de space scene: the nebula renders into a CSS-sized target and is
	// blitted up, stars are generated from their vertex id, and the meteors work
	// out their own schedule from the time uniform.
	
	
	function initSpace() {
		const canvas = document.getElementById('space');
		if (!canvas) return;
	
		const gl = canvas.getContext('webgl2', {
			antialias: false,
			alpha: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: false,
		});
	
		if (!gl) {
			canvas.style.display = 'none';
			return;
		}
	
		const overlay = document.querySelector('.overlay');
	
		const starProgram = createProgram(gl, starVertexSource, starFragmentSource);
		const meteorProgram = createProgram(
			gl,
			quadVertexSource,
			meteorFragmentSource,
		);
		const nebulaProgram = createProgram(
			gl,
			quadVertexSource,
			nebulaFragmentSource,
		);
		const blitProgram = createProgram(gl, quadVertexSource, blitFragmentSource);
		if (!starProgram || !meteorProgram || !nebulaProgram || !blitProgram) {
			canvas.style.display = 'none';
			return;
		}
	
		const loc = (program, name) => gl.getUniformLocation(program, name);
	
		const uniforms = {
			star: {
				res: loc(starProgram, 'u_res'),
				time: loc(starProgram, 'u_time'),
				scroll: loc(starProgram, 'u_scroll'),
				dpr: loc(starProgram, 'u_dpr'),
			},
			nebula: {
				res: loc(nebulaProgram, 'u_res'),
				time: loc(nebulaProgram, 'u_time'),
				scroll: loc(nebulaProgram, 'u_scroll'),
				primary: loc(nebulaProgram, 'u_primary'),
				secondary: loc(nebulaProgram, 'u_secondary'),
			},
			blit: {
				tex: loc(blitProgram, 'u_tex'),
				screen: loc(blitProgram, 'u_screen'),
			},
			meteor: {
				res: loc(meteorProgram, 'u_res'),
				time: loc(meteorProgram, 'u_time'),
			},
		};
	
		const triangle = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW,
		);
	
		const state = {
			gl,
			canvas,
			programs: {
				star: starProgram,
				meteor: meteorProgram,
				nebula: nebulaProgram,
				blit: blitProgram,
			},
			uniforms,
			vaos: {
				star: gl.createVertexArray(),
				nebula: bindTriangle(gl, triangle, nebulaProgram),
				blit: bindTriangle(gl, triangle, blitProgram),
				meteor: bindTriangle(gl, triangle, meteorProgram),
			},
			target: null,
			starCount: 0,
			dpr: 1,
			startedAt: performance.now(),
			colors: {
				lastPrimary: '',
				lastSecondary: '',
				primary: [0.63, 0.14, 1],
				secondary: [1, 0, 0.9],
			},
		};
	
		function resizeSpace() {
			const rect = canvas.getBoundingClientRect();
			const width = Math.max(1, rect.width);
			const height = Math.max(1, rect.height);
	
			state.dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * state.dpr);
			canvas.height = Math.round(height * state.dpr);
			state.starCount = Math.min(
				2600,
				Math.max(240, Math.round((width * height) / 1800)),
			);
	
			const nebulaScale = Math.min(1, 1920 / width);
			state.target = ensureTarget(
				gl,
				state.target,
				Math.max(1, Math.round(width * nebulaScale)),
				Math.max(1, Math.round(height * nebulaScale)),
			);
		}
	
		resizeSpace();
	
		if (typeof ResizeObserver !== 'undefined' && overlay) {
			let resizeTimer = 0;
			new ResizeObserver(() => {
				window.clearTimeout(resizeTimer);
				resizeTimer = window.setTimeout(resizeSpace, 150);
			}).observe(overlay);
		} else {
			window.addEventListener('resize', resizeSpace);
		}
	
		registerLoop('space', () => drawSpace(state));
	}

	app.space = {
		init: initSpace,
	};
})(window.Lucyd = window.Lucyd || {});
