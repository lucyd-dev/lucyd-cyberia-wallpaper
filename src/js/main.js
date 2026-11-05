/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Single entry point for the wallpaper. Wallpaper Engine loads local files
// without module support, so the scripts are classic and have to keep their
// order. Writing them while the document is parsing keeps the timing identical
// to static script tags, without listing every file in index.html.

(function () {
	'use strict';

	const files = [
		'core/constants.js',
		'core/color.js',
		'core/loop.js',
		'core/properties.js',
		'core/apply-properties.js',
		'layout/chrome.js',
		'layout/version.js',
		'engines/space/shaders/quad-vertex.js',
		'engines/space/shaders/star.js',
		'engines/space/shaders/meteor.js',
		'engines/space/shaders/nebula.js',
		'engines/space/shaders/blit.js',
		'engines/space/gl.js',
		'engines/space/draw.js',
		'engines/space/scene.js',
		'engines/matrix-glow/shaders.js',
		'engines/matrix-glow/programs.js',
		'engines/matrix-glow/targets.js',
		'engines/matrix-glow/index.js',
		'engines/camo/shader.js',
		'engines/camo/targets.js',
		'engines/camo/index.js',
		'engines/audio-visualizer.js',
		'engines/matrix.js',
		'engines/day-night.js',
		'media/crossfade.js',
		'media/view.js',
		'media/index.js',
		'ui/widgets.js',
		'boot.js',
	];

	const base = 'src/js/';

	files.forEach((file) => {
		document.write(`<script src="${base}${file}"><\/script>`);
	});
})();
