/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const DEFAULT_LATITUDE = 50;

const SUN_SVG =
	'M18 35A17 17 0 1 0 52 35A17 17 0 1 0 18 35Z M58 38.2L66.8 38.2A3.2 3.2 0 0 0 66.8 31.8L58 31.8Z M49 53.53L55.22 59.75A3.2 3.2 0 0 0 59.75 55.22L53.53 49Z M31.8 58L31.8 66.8A3.2 3.2 0 0 0 38.2 66.8L38.2 58Z M16.47 49L10.25 55.22A3.2 3.2 0 0 0 14.78 59.75L21 53.53Z M12 31.8L3.2 31.8A3.2 3.2 0 0 0 3.2 38.2L12 38.2Z M21 16.47L14.78 10.25A3.2 3.2 0 0 0 10.25 14.78L16.47 21Z M38.2 12L38.2 3.2A3.2 3.2 0 0 0 31.8 3.2L31.8 12Z M53.53 21L59.75 14.78A3.2 3.2 0 0 0 55.22 10.25L49 16.47Z';

const MOON_SVG =
	'M34.48 0.03C27.24 5.51 22.56 14.19 22.56 23.97C22.56 40.54 35.99 53.97 52.56 53.97C58.39 53.97 63.84 52.3 68.45 49.42C62.94 61.54 50.74 69.97 36.56 69.97C17.23 69.97 1.56 54.3 1.56 34.97C1.56 16.34 16.12 1.11 34.48 0.03Z';

const dayNightCanvas = document.querySelector('.dayNight');

function isDaytime(now) {
	const rad = Math.PI / 180;
	const lat = DEFAULT_LATITUDE * rad;

	const start = new Date(now.getFullYear(), 0, 1);
	const dayOfYear = Math.floor((now - start) / 86400000) + 1;

	const decl = 23.44 * Math.sin(rad * (360 / 365) * (dayOfYear - 81)) * rad;
	const cosH = -Math.tan(lat) * Math.tan(decl);

	if (cosH <= -1) return true;
	if (cosH >= 1) return false;

	const hourAngle = Math.acos(cosH) / rad;

	const b = rad * (360 / 365) * (dayOfYear - 81);
	const equationOfTime =
		9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

	const solarNoon = 12 - equationOfTime / 60;
	const sunrise = solarNoon - hourAngle / 15;
	const sunset = solarNoon + hourAngle / 15;

	const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
	return hour >= sunrise && hour < sunset;
}

function updateDayNight() {
	const svg = isDaytime(new Date()) ? SUN_SVG : MOON_SVG;
	if (dayNightCanvas.dataset.svg !== svg) {
		dayNightCanvas.dataset.svg = svg;
	}
}

updateDayNight();
setInterval(updateDayNight, 60000);
