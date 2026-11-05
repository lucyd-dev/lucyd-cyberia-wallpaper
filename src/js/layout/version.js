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

	// Reads the project version for the terminal prompt. Wallpaper Engine may not
	// expose local files over fetch, so the fallback is the last known version.
	
	const FALLBACK_VERSION = 3;
	
	function initVersion() {
		const label = document.getElementById('projectVersion');
		if (!label) return;
	
		loadVersion();
	
		async function loadVersion() {
			let version = FALLBACK_VERSION;
	
			try {
				const response = await fetch('project.json', { cache: 'no-store' });
				if (response.ok) {
					const project = await response.json();
					const parsed = Number(project.version);
					if (Number.isFinite(parsed)) version = parsed;
				}
			} catch (error) {
				// Keep the fallback when the file is not reachable.
			}
	
			label.textContent = `v${version.toFixed(1)}`;
		}
	}

	app.version = {
		init: initVersion,
	};
})(window.Lucyd = window.Lucyd || {});
