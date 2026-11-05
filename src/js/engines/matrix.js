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
	const { numToRGBA } = app.color;
	const { registerLoop } = app.loop;

	// Matrix rain. Every column carries its own trail; the newest glyph uses the
	// secondary colour, the rest fade out in the primary colour.
	
	
	const characters =
		'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	
	const TRAIL_LENGTH = 14;
	const TRAIL_FALLOFF = 1.6;
	const MIN_TRAIL_ALPHA = 0.02;
	
	function initMatrix() {
		const canvas = document.getElementById('matrix');
		if (!canvas) return;
	
		const ctx = canvas.getContext('2d');
		const overlay = document.querySelector('.overlay');
	
		let columns = 0;
		let fontsize = 16;
		let symbols = [];
		let primaryColor = '';
		let secondaryColor = '';
		let lastPrimaryRaw = '';
		let lastSecondaryRaw = '';
	
		function resizeMatrix() {
			const rootStyle = getComputedStyle(document.documentElement);
			fontsize = rootStyle.fontSize ? parseFloat(rootStyle.fontSize) : 16;
	
			const width = (overlay ? overlay.clientWidth : window.innerWidth) / 2;
			const height = overlay ? overlay.clientHeight : window.innerHeight;
	
			canvas.width = width;
			canvas.height = height;
			columns = Math.floor(width / fontsize);
	
			symbols = [];
			for (let i = 0; i < columns; i++) {
				symbols.push({
					x: i,
					y: Math.floor(Math.random() * -100),
					trail: [],
				});
			}
		}
	
		resizeMatrix();
	
		if (typeof ResizeObserver !== 'undefined' && overlay) {
			new ResizeObserver(resizeMatrix).observe(overlay);
		} else {
			window.addEventListener('resize', resizeMatrix);
		}
	
		registerLoop('matrix', drawMatrix);
	
		function drawMatrix() {
			if (props.general.primary !== lastPrimaryRaw) {
				lastPrimaryRaw = props.general.primary;
				primaryColor = numToRGBA(lastPrimaryRaw);
			}
			if (props.general.secondary !== lastSecondaryRaw) {
				lastSecondaryRaw = props.general.secondary;
				secondaryColor = numToRGBA(lastSecondaryRaw);
			}
	
			const fps = props.fps || 30;
			const step = 20 / fps;
			const resetChance = 0.02 * step;
	
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.textAlign = 'center';
			ctx.font = `${fontsize}px monospace`;
	
			symbols.forEach((symbol) => {
				const fromCell = Math.floor(symbol.y);
				symbol.y += step;
				const toCell = Math.floor(symbol.y);
	
				for (let cell = fromCell + 1; cell <= toCell; cell++) {
					symbol.trail.push({
						char: characters.charAt(
							Math.floor(Math.random() * characters.length),
						),
						cell,
					});
				}
	
				while (
					symbol.trail.length &&
					symbol.y - symbol.trail[0].cell >= TRAIL_LENGTH
				) {
					symbol.trail.shift();
				}
	
				symbol.trail.forEach((glyph) => {
					const age = symbol.y - glyph.cell;
					if (age < 0) return;
	
					const alpha = Math.pow(1 - age / TRAIL_LENGTH, TRAIL_FALLOFF);
					if (alpha < MIN_TRAIL_ALPHA) return;
	
					ctx.globalAlpha = alpha;
					ctx.fillStyle = age < 1 ? secondaryColor : primaryColor;
					ctx.fillText(glyph.char, symbol.x * fontsize, glyph.cell * fontsize);
				});
	
				if (symbol.y * fontsize > canvas.height && Math.random() < resetChance) {
					symbol.y = 0;
					symbol.trail.length = 0;
				}
			});
	
			ctx.globalAlpha = 1;
		}
	}

	app.matrix = {
		init: initMatrix,
	};
})(window.Lucyd = window.Lucyd || {});
