/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const continuousRenderers = new Map();
const continuousAsyncRenderers = new Map();
const dataRenderers = new Map();
const latestData = new Map();
const currentFps = 1000 / (PROPS.fps || 30);
const virtualFps = 1000 / 30;
let lastTime = 0;
let timer = 0;

function registerLoop(id, cb) {
	continuousRenderers.set(id, cb);
}
function registerAsyncLoop(id, cb) {
	continuousAsyncRenderers.set(id, cb);
}

function registerDataRenderer(id, cb) {
	dataRenderers.set(id, cb);
}

function updateData(id, data) {
	latestData.set(id, data);
}

function render(timeStamp = 0) {
	requestAnimationFrame(render);

	if (!lastTime) {
		lastTime = timeStamp;
		return;
	}


	const deltaTime = timeStamp - lastTime;
	
	if (deltaTime < currentFps) {
		return;
	}

	lastTime = timeStamp;
	timer += deltaTime;
    
	while (timer >= virtualFps) {
		continuousRenderers.forEach((cb) => cb());

		dataRenderers.forEach((cb, id) => {
			if (latestData.has(id)) {
				cb({
                    data: latestData.get(id)
                });
			}
		});
		timer -= virtualFps;
	}
}
render();
