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

	// Values shared between the canvas engines and the layout code. The slope
	// angle is duplicated in the CSS as `rotate(15deg)`; change both together.
	const SLOPE_ANGLE = (15 * Math.PI) / 180;
	
	const MEDIA_RESET_DELAY = 1200;
	const MEDIA_FADE_DURATION = 480;

	app.constants = {
		SLOPE_ANGLE: SLOPE_ANGLE,
		MEDIA_RESET_DELAY: MEDIA_RESET_DELAY,
		MEDIA_FADE_DURATION: MEDIA_FADE_DURATION,
	};
})(window.Lucyd = window.Lucyd || {});
