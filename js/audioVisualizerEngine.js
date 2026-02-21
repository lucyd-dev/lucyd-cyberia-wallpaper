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
	const leftChannel = audioArray.slice(0, halfCount);
	const rightChannel = audioArray.slice(halfCount);
	const sliceWidth = width / (halfCount - 1);

	const leftMax = Math.max(...leftChannel.map((v) => Math.abs(v)));
	const rightMax = Math.max(...rightChannel.map((v) => Math.abs(v)));
	let scale = Math.max(leftMax, rightMax, 0.01);

	const leftPoints = [];
	const rightPoints = [];

	for (let i = 0; i < halfCount; i++) {
		const x = i * sliceWidth;

		leftPoints.push({
			x,
			y: (height - 10) * (1 - leftChannel[i] / scale),
		});

		rightPoints.push({
			x,
			y: (height - 20) * (1 - rightChannel[i] / scale),
		});
	}

	audioCanvasCtx.beginPath();
	drawSmoothCurve(audioCanvasCtx, rightPoints);
	audioCanvasCtx.lineTo(width, height);
	audioCanvasCtx.lineTo(0, height);
	audioCanvasCtx.closePath();
	audioCanvasCtx.fillStyle = numToRGBA(PROPS.general.secondary, 0.5);
	audioCanvasCtx.fill();

	audioCanvasCtx.beginPath();
	drawSmoothCurve(audioCanvasCtx, leftPoints);
	audioCanvasCtx.lineTo(width, height);
	audioCanvasCtx.lineTo(0, height);
	audioCanvasCtx.closePath();
	audioCanvasCtx.fillStyle = numToRGBA(PROPS.general.primary, 1);
	audioCanvasCtx.fill();
}

function drawSmoothCurve(ctx, points) {
	if (points.length < 2) return;

	ctx.moveTo(points[0].x, points[0].y);

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i === 0 ? i : i - 1];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;

		ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
	}
}
