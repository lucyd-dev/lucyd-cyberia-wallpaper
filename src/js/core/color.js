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

	// Wallpaper Engine hands colours over as three space separated floats.
	function numToRGB(num) {
		return num.split(' ').map((c) => Math.ceil(c * 255));
	}
	
	function numToRGBA(num, alpha = 1) {
		return `rgba(${numToRGB(num)}, ${alpha})`;
	}

	app.color = {
		numToRGB: numToRGB,
		numToRGBA: numToRGBA,
	};
})(window.Lucyd = window.Lucyd || {});
