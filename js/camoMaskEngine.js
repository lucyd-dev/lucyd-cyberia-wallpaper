/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

let config = {
	morphSpeed: 0.3,
	scale: 20,
	color1: numToRGB(PROPS.general.primary),
	color2: numToRGB(PROPS.general.secondary),
};

const glCanvas = document.createElement('canvas');
const gl = glCanvas.getContext('webgl');

function resizeEngine() {
	glCanvas.width = window.innerWidth;
	glCanvas.height = window.innerHeight;
	gl.viewport(0, 0, glCanvas.width, glCanvas.height);
}
window.addEventListener('resize', resizeEngine);
resizeEngine();

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	return shader;
}
const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
gl.linkProgram(program);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'position');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
	gl.ARRAY_BUFFER,
	new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
	gl.STATIC_DRAW,
);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
const timeLoc = gl.getUniformLocation(program, 'u_time');
const color1Loc = gl.getUniformLocation(program, 'u_color1');
const color2Loc = gl.getUniformLocation(program, 'u_color2');
const scaleLoc = gl.getUniformLocation(program, 'u_scale');

let lastRenderTime = 0;
let shaderTime = 0;


registerLoop('camoFilter', drawCamo);

function drawCamo() {
		shaderTime += virtualFps * 0.001 * config.morphSpeed;
		
		config.color1 = numToRGB(PROPS.general.primary);
		config.color2 = numToRGB(PROPS.general.secondary);

		gl.uniform2f(resolutionLoc, glCanvas.width, glCanvas.height);
		gl.uniform1f(timeLoc, shaderTime);
		gl.uniform1f(scaleLoc, config.scale);
		gl.uniform3f(
			color1Loc,
			config.color1[0] / 255,
			config.color1[1] / 255,
			config.color1[2] / 255,
		);
		gl.uniform3f(
			color2Loc,
			config.color2[0] / 255,
			config.color2[1] / 255,
			config.color2[2] / 255,
		);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// B. Auto-Size and Pour into HTML targets
		const targets = document.querySelectorAll('.camo-fx');
		targets.forEach((canvas) => {
			const ctx = canvas.getContext('2d');

			// --- NEW: Read styles directly from your CSS! ---
			const styles = window.getComputedStyle(canvas);
			const fontStr = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;

			if (canvas.dataset.text) {
				ctx.font = fontStr;
				const text = canvas.dataset.text;

				// Measure text width
				const textW = ctx.measureText(text).width;

				// Extract the exact pixel size from CSS (e.g., "120px" -> 120)
				const fontSizePx = parseFloat(styles.fontSize);

				// Add safe padding to prevent ANY clipping
				const targetW = Math.ceil(textW);
				const targetH = Math.ceil(fontSizePx * 1.1);

				// Resize if needed
				if (canvas.width !== targetW || canvas.height !== targetH) {
					canvas.width = targetW;
					canvas.height = targetH;
				}
			}

			// Re-grab dimensions
			const w = canvas.width;
			const h = canvas.height;

			// Clear the frame
			ctx.globalCompositeOperation = 'source-over';
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = 'white';

			// Draw Text Stencil
			if (canvas.dataset.text) {
				ctx.font = fontStr; // Must set font again after a canvas resizes!
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(canvas.dataset.text, w / 2, h / 2);
			}
			// Draw SVG Stencil
			if (canvas.dataset.svg) {
				ctx.fill(new Path2D(canvas.dataset.svg));
			}

			// Cut out the Camouflage
			ctx.globalCompositeOperation = 'source-in';
			const rect = canvas.getBoundingClientRect();
			ctx.drawImage(glCanvas, rect.left, rect.top, w, h, 0, 0, w, h);
		});
}
