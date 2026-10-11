/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const continuousRenderers = new Map();
const dataRenderers = new Map();
const latestData = new Map();
const dataDirty = new Set();
let frameInterval = 1000 / (PROPS.fps || 30);
let maxDeltaTime = frameInterval * 5;
let lastTime = 0;
let timer = 0;

function setFps(fps) {
	frameInterval = 1000 / (fps || 30);
	maxDeltaTime = frameInterval * 5;
}

function registerLoop(id, cb) {
	continuousRenderers.set(id, cb);
}

function registerDataRenderer(id, cb) {
	dataRenderers.set(id, cb);
}

function updateData(id, data) {
	latestData.set(id, data);
	dataDirty.add(id);
}

function render(timeStamp = 0) {
	requestAnimationFrame(render);

	if (!lastTime) {
		lastTime = timeStamp;
		return;
	}

	const deltaTime = Math.min(timeStamp - lastTime, maxDeltaTime);

	if (deltaTime < frameInterval) {
		return;
	}

	lastTime = timeStamp;
	timer += deltaTime;

	if (timer > maxDeltaTime) {
		timer = maxDeltaTime;
	}

	while (timer >= frameInterval) {
		continuousRenderers.forEach((cb) => cb());

		dataRenderers.forEach((cb, id) => {
			if (dataDirty.has(id)) {
				cb({ data: latestData.get(id) });
				dataDirty.delete(id);
			}
		});

		timer -= frameInterval;
	}
}
render();
