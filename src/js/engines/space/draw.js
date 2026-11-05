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

	// Per-frame pass order: nebula into the reduced target, blit it up, add the
	// stars, then add the meteors.
	
	
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
	
	function drawSpace(state) {
		const { gl, canvas, programs, uniforms, vaos, target, colors } = state;
		if (!target) return;
	
		if (props.general.primary !== colors.lastPrimary) {
			colors.lastPrimary = props.general.primary;
			colors.primary = readColor(colors.lastPrimary);
		}
		if (props.general.secondary !== colors.lastSecondary) {
			colors.lastSecondary = props.general.secondary;
			colors.secondary = readColor(colors.lastSecondary);
		}
	
		const seconds = (performance.now() - state.startedAt) / 1000;
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
		gl.viewport(0, 0, target.width, target.height);
		gl.disable(gl.BLEND);
		gl.useProgram(programs.nebula);
		gl.bindVertexArray(vaos.nebula);
		gl.uniform2f(uniforms.nebula.res, target.width, target.height);
		gl.uniform1f(uniforms.nebula.time, seconds);
		gl.uniform1f(uniforms.nebula.scroll, 0);
		gl.uniform3f(
			uniforms.nebula.primary,
			colors.primary[0],
			colors.primary[1],
			colors.primary[2],
		);
		gl.uniform3f(
			uniforms.nebula.secondary,
			colors.secondary[0],
			colors.secondary[1],
			colors.secondary[2],
		);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(programs.blit);
		gl.bindVertexArray(vaos.blit);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, target.texture);
		gl.uniform1i(uniforms.blit.tex, 0);
		gl.uniform2f(uniforms.blit.screen, canvas.width, canvas.height);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	
		gl.blendFunc(gl.ONE, gl.ONE);
		gl.useProgram(programs.star);
		gl.bindVertexArray(vaos.star);
		gl.uniform2f(uniforms.star.res, canvas.width, canvas.height);
		gl.uniform1f(uniforms.star.time, seconds);
		gl.uniform1f(uniforms.star.scroll, 0);
		gl.uniform1f(uniforms.star.dpr, state.dpr);
		gl.drawArrays(gl.POINTS, 0, state.starCount);
	
		gl.useProgram(programs.meteor);
		gl.bindVertexArray(vaos.meteor);
		gl.uniform2f(uniforms.meteor.res, canvas.width, canvas.height);
		gl.uniform1f(uniforms.meteor.time, seconds);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	
		gl.bindVertexArray(null);
	}

	app.spaceDraw = {
		draw: drawSpace,
	};
})(window.Lucyd = window.Lucyd || {});
