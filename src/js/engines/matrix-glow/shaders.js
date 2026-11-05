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

	// Bloom passes for the matrix canvas: bright pass, separable blur, additive
	// composite.
	
	const vertexSource = `
	attribute vec2 position;
	varying vec2 v_uv;

	void main() {
		v_uv = position * 0.5 + 0.5;
		gl_Position = vec4(position, 0.0, 1.0);
	}
`;
	
	const brightSource = `
	precision highp float;
	varying vec2 v_uv;
	uniform sampler2D u_source;
	uniform float u_threshold;

	void main() {
		vec3 color = texture2D(u_source, v_uv).rgb;
		float luminance = dot(color, vec3(0.299, 0.587, 0.114));
		float bright = smoothstep(u_threshold, u_threshold + 0.35, luminance);
		gl_FragColor = vec4(color * bright, 1.0);
	}
`;
	
	const blurSource = `
	precision highp float;
	varying vec2 v_uv;
	uniform sampler2D u_image;
	uniform vec2 u_direction;

	void main() {
		vec3 sum = texture2D(u_image, v_uv).rgb * 0.227027;
		sum += texture2D(u_image, v_uv + u_direction * 1.0).rgb * 0.1945946;
		sum += texture2D(u_image, v_uv - u_direction * 1.0).rgb * 0.1945946;
		sum += texture2D(u_image, v_uv + u_direction * 2.0).rgb * 0.1216216;
		sum += texture2D(u_image, v_uv - u_direction * 2.0).rgb * 0.1216216;
		sum += texture2D(u_image, v_uv + u_direction * 3.0).rgb * 0.054054;
		sum += texture2D(u_image, v_uv - u_direction * 3.0).rgb * 0.054054;
		sum += texture2D(u_image, v_uv + u_direction * 4.0).rgb * 0.016216;
		sum += texture2D(u_image, v_uv - u_direction * 4.0).rgb * 0.016216;
		gl_FragColor = vec4(sum, 1.0);
	}
`;
	
	const compositeSource = `
	precision highp float;
	varying vec2 v_uv;
	uniform sampler2D u_image;
	uniform float u_intensity;

	void main() {
		gl_FragColor = vec4(texture2D(u_image, v_uv).rgb * u_intensity, 1.0);
	}
`;

	app.matrixGlowShaders = {
		vertexSource: vertexSource,
		brightSource: brightSource,
		blurSource: blurSource,
		compositeSource: compositeSource,
	};
})(window.Lucyd = window.Lucyd || {});
