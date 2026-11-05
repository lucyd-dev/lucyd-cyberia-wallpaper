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

	// Fullscreen triangle used by the meteor, nebula and blit passes.
	
	const quadVertexSource = `#version 300 es

in vec2 a_pos;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

	Object.assign((app.spaceShaders = app.spaceShaders || {}), {
		quadVertexSource: quadVertexSource,
	});
})(window.Lucyd = window.Lucyd || {});
