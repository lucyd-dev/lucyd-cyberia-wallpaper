/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Boot order matters twice: properties have to be applied before anything
// reads the colours, and the engine init order is the draw order inside the
// shared frame loop.

(function (app) {
	'use strict';

	function boot() {
		app.props.init(app.applyProps.apply);
		app.loop.setFps(app.props.values.fps);
		app.applyProps.apply();

		app.chrome.init();
		app.version.init();

		app.space.init();
		app.widgets.init();
		app.media.init();
		app.audio.init();
		app.matrix.init();
		app.matrixGlow.init();
		app.dayNight.init();
		app.camo.init();

		app.loop.start();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(window.Lucyd = window.Lucyd || {});
