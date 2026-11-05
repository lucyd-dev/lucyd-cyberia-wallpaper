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

	const { MEDIA_FADE_DURATION } = app.constants;

	// Crossfades the blurred background and the cover. Each layer has a token so a
	// late image load from an old track can never overwrite the current one.
	
	
	let backgroundTimer = null;
	let backgroundToken = 0;
	let coverTimer = null;
	let coverToken = 0;
	
	function crossfadeBackground(url, immediate) {
		const base = document.getElementById('musicBg');
		const next = document.getElementById('musicBgNext');
		const value = `url(${url})`;
	
		backgroundToken += 1;
		const token = backgroundToken;
	
		clearTimeout(backgroundTimer);
		backgroundTimer = null;
	
		if (immediate || !next) {
			base.style.backgroundImage = value;
			if (next) next.classList.remove('show');
			return;
		}
	
		next.style.backgroundImage = value;
		void next.offsetWidth;
		next.classList.add('show');
	
		backgroundTimer = setTimeout(() => {
			if (token !== backgroundToken) return;
	
			base.style.backgroundImage = value;
			next.classList.remove('show');
			backgroundTimer = null;
		}, MEDIA_FADE_DURATION);
	}
	
	function crossfadeCover(url, immediate) {
		const base = document.getElementById('songCover');
		const next = document.getElementById('songCoverNext');
	
		coverToken += 1;
		const token = coverToken;
	
		clearTimeout(coverTimer);
		coverTimer = null;
	
		if (immediate || !next) {
			base.src = url;
			if (next) next.classList.remove('show');
			return;
		}
	
		const preload = new Image();
		preload.onload = () => {
			if (token !== coverToken) return;
	
			next.src = url;
			void next.offsetWidth;
			next.classList.add('show');
	
			coverTimer = setTimeout(() => {
				if (token !== coverToken) return;
	
				base.src = url;
				next.classList.remove('show');
				coverTimer = null;
			}, MEDIA_FADE_DURATION);
		};
		preload.src = url;
	}

	app.mediaCrossfade = {
		background: crossfadeBackground,
		cover: crossfadeCover,
	};
})(window.Lucyd = window.Lucyd || {});
