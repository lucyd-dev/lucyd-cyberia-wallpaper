/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const audioCanvas = document.getElementById('audioVisual');
const audioCanvasCtx = audioCanvas.getContext('2d');

audioCanvas.height = window.innerHeight * 0.05;
audioCanvas.width = Math.sin((75 * Math.PI) / 180) * window.innerHeight * 1.1;

window.addEventListener('resize', () => {
	audioCanvas.height = window.innerHeight * 0.05;
	audioCanvas.width =
		Math.sin((75 * Math.PI) / 180) * window.innerHeight * 1.1;
});

registerDataRenderer('audio', drawAudioBar);

window.wallpaperRegisterAudioListener((audioArray) => {
	updateData('audio', { audioArray });
});

function drawAudioBar({ data: { audioArray } }) {
	audioCanvasCtx.fillStyle = 'rgb(0,0,0)';
	audioCanvasCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);

	const width = audioCanvas.width;
	const height = audioCanvas.height;

	const halfCount = audioArray.length / 2;
	const sliceWidth = width / (halfCount - 1);

	let scale = 0.01;
	for (let i = 0; i < audioArray.length; i++) {
		const value = Math.abs(audioArray[i]);
		if (value > scale) scale = value;
	}

	audioCanvasCtx.beginPath();
	drawSmoothCurve(
		audioCanvasCtx,
		audioArray,
		halfCount,
		height - 20,
		scale,
		sliceWidth,
	);
	audioCanvasCtx.lineTo(width, height);
	audioCanvasCtx.lineTo(0, height);
	audioCanvasCtx.closePath();
	audioCanvasCtx.fillStyle = numToRGBA(PROPS.general.secondary, 0.5);
	audioCanvasCtx.fill();

	audioCanvasCtx.beginPath();
	drawSmoothCurve(
		audioCanvasCtx,
		audioArray,
		0,
		height - 10,
		scale,
		sliceWidth,
	);
	audioCanvasCtx.lineTo(width, height);
	audioCanvasCtx.lineTo(0, height);
	audioCanvasCtx.closePath();
	audioCanvasCtx.fillStyle = numToRGBA(PROPS.general.primary, 1);
	audioCanvasCtx.fill();
}

function drawSmoothCurve(ctx, audioArray, start, baseHeight, scale, sliceWidth) {
	const count = audioArray.length / 2;
	if (count < 2) return;

	ctx.moveTo(0, baseHeight * (1 - audioArray[start] / scale));

	for (let i = 0; i < count - 1; i++) {
		const i0 = i === 0 ? 0 : i - 1;
		const i3 = i + 2 < count ? i + 2 : i + 1;

		const y0 = baseHeight * (1 - audioArray[start + i0] / scale);
		const y1 = baseHeight * (1 - audioArray[start + i] / scale);
		const y2 = baseHeight * (1 - audioArray[start + i + 1] / scale);
		const y3 = baseHeight * (1 - audioArray[start + i3] / scale);

		const x1 = i * sliceWidth;
		const x2 = (i + 1) * sliceWidth;

		const cp1x = x1 + (x2 - i0 * sliceWidth) / 6;
		const cp1y = y1 + (y2 - y0) / 6;
		const cp2x = x2 - (i3 * sliceWidth - x1) / 6;
		const cp2y = y2 - (y3 - y1) / 6;

		ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
	}
}
