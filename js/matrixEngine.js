/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const characters =
	'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const canvas = document.getElementById('matrix');
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
		symbols.push({ x: i, y: Math.floor(Math.random() * -100) });
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
	if (PROPS.general.primary !== lastPrimaryRaw) {
		lastPrimaryRaw = PROPS.general.primary;
		primaryColor = numToRGBA(lastPrimaryRaw);
	}
	if (PROPS.general.secondary !== lastSecondaryRaw) {
		lastSecondaryRaw = PROPS.general.secondary;
		secondaryColor = numToRGBA(lastSecondaryRaw);
	}

	const fps = PROPS.fps || 30;
	const step = 30 / fps;
	const alpha = 1 - Math.pow(0.9, step);
	const resetChance = 0.02 * step;

	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.globalCompositeOperation = 'source-over';

	ctx.textAlign = 'center';
	ctx.font = `${fontsize}px monospace`;

	symbols.forEach((symbol) => {
		const fromCell = Math.floor(symbol.y);
		symbol.y += step;
		const toCell = Math.floor(symbol.y);

		for (let cell = fromCell + 1; cell <= toCell; cell++) {
			const text = characters.charAt(
				Math.floor(Math.random() * characters.length),
			);
			ctx.fillStyle = Math.random() < 0.1 ? secondaryColor : primaryColor;
			ctx.fillText(text, symbol.x * fontsize, cell * fontsize);
		}

		if (symbol.y * fontsize > canvas.height && Math.random() < resetChance) {
			symbol.y = 0;
		}
	});
}
