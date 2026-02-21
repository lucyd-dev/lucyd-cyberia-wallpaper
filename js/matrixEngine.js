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
const rootStyle = getComputedStyle(document.documentElement);
const fontsize = rootStyle.fontSize ? parseFloat(rootStyle.fontSize) : 16;
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth / 2;
canvas.height = window.innerHeight;
let columns = canvas.width / fontsize;
let matrixTime = 0;

let symbols = [];
for (let i = 0; i < columns; i++) {
	symbols.push({ x: i, y: Math.floor(Math.random() * -100) });
}

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	columns = canvas.width / fontsize;
});

registerLoop('matrix', drawMatrix);

function drawMatrix() {
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.globalCompositeOperation = 'source-over';
	
	symbols.forEach((symbol) => {
		let text = characters.charAt(
			Math.floor(Math.random() * characters.length)
		);
		
		const color = Math.random() < 0.1 ? PROPS.general.secondary : PROPS.general.primary;
		
		ctx.textAlign = 'center';
		ctx.fillStyle = numToRGBA(color);
		ctx.font = `${fontsize}px monospace`;
		ctx.fillText(text, symbol.x * fontsize, symbol.y * fontsize);
		
		if (symbol.y * fontsize > canvas.height && Math.random() < 0.02) {
			symbol.y = 0;
		} else {
			symbol.y += 1;
		}
	});
}
