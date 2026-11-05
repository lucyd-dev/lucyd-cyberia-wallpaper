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

	// Scales the reduced-resolution nebula target back to the screen.
	
	const blitFragmentSource = `#version 300 es
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_screen;

out vec4 fragColor;

void main() {
  fragColor = texture(u_tex, gl_FragCoord.xy / u_screen);
}
`;

	Object.assign((app.spaceShaders = app.spaceShaders || {}), {
		blitFragmentSource: blitFragmentSource,
	});
})(window.Lucyd = window.Lucyd || {});
