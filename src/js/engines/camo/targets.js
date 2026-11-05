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

	// Bookkeeping for every element that should receive the camouflage mask: the
	// clock glyph and the title canvas, both scaled to their content.
	
	function createTargetRegistry() {
		const targets = [];
	
		function refreshFonts() {
			targets.forEach((target) => {
				const styles = window.getComputedStyle(target.canvas);
				target.fontStr = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
				target.fontSizePx = parseFloat(styles.fontSize);
				target.builtText = null;
			});
		}
	
		function fit(target) {
			if (!target.text) return;
	
			const { canvas, ctx } = target;
			ctx.font = target.fontStr;
	
			const targetW = Math.ceil(ctx.measureText(target.text).width);
			const targetH = Math.ceil(target.fontSizePx * 1.1);
	
			if (canvas.width !== targetW || canvas.height !== targetH) {
				canvas.width = targetW;
				canvas.height = targetH;
			}
	
			target.builtText = target.text;
			target.rect = canvas.getBoundingClientRect();
			canvas.style.visibility = 'visible';
		}
	
		function updateRects() {
			targets.forEach((target) => {
				target.rect = target.canvas.getBoundingClientRect();
			});
		}
	
		function relayout() {
			refreshFonts();
			targets.forEach(fit);
			updateRects();
		}
	
		function register() {
			targets.length = 0;
			document.querySelectorAll('.camo-fx').forEach((canvas) => {
				targets.push({
					canvas,
					ctx: canvas.getContext('2d'),
					svg: canvas.dataset.svg || '',
					path: canvas.dataset.svg ? new Path2D(canvas.dataset.svg) : null,
					text: '',
					builtText: null,
					fontStr: '',
					fontSizePx: 0,
					rect: { left: 0, top: 0 },
				});
			});
			refreshFonts();
			updateRects();
		}
	
		return {
			targets,
			register,
			relayout,
			fit,
		};
	}

	app.camoTargets = {
		create: createTargetRegistry,
	};
})(window.Lucyd = window.Lucyd || {});
