/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const dayNight = document.getElementsByClassName('dayNight')[0];
const clock = document.getElementById('clock');
const date = document.getElementById('date');
const loads = document.getElementsByClassName('load');

function updateClock() {
	const dateObj = new Date();
	date.innerText = `${dateObj.toLocaleDateString('en-GB', {
        weekday: "short",
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
	})}`;
	clock.innerText = `${dateObj.toLocaleTimeString('en-GB')}`;
}
setInterval(updateClock, 1000);

function animateTerminal() {
	for (let i = 0; i < loads.length; i++) {
		if (Math.random() < 0.05) {
			const load = loads[i];
			let lValue = load.currentValue || 0;
			
			if (!lValue) {
				lValue = Math.floor(Math.random() * 11);
			}
			let step = Math.floor(Math.random() * 3) - 1;
			if (Math.random() < 0.025) {
				step += Math.floor(Math.random() * 4);
			}
			
			load.currentValue = Math.max(1, Math.min(10, lValue + step));
			let loadBar = '#'.repeat(load.currentValue) + '-'.repeat(10 - load.currentValue);
			load.innerText = `[${loadBar}]`;
		}
	}
	
	const cursor = document.getElementById('blinkingCursor');
	if (cursor) {
		const now = Date.now();
		const opacity = (Math.sin(now * 0.005) + 1) / 2;
		cursor.style.opacity = opacity;
	}
}
registerLoop('terminal', animateTerminal);
