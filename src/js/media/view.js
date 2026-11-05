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

	const { background: crossfadeBackground, cover: crossfadeCover } = app.mediaCrossfade;

	// Everything that writes to the player card. The state machine lives in
	// index.js; this module only renders what it is told.
	
	
	let lastShownSecond = -1;
	let lastShownDuration = -1;
	let lastTimebarVisible = null;
	
	function widget() {
		return document.getElementById('musicWidget');
	}
	
	function formatTime(sec) {
		const dateObj = new Date(0);
		dateObj.setSeconds(sec);
		return dateObj.toISOString().substring(11, 19);
	}
	
	function isNoSignal() {
		return widget().classList.contains('no-signal');
	}
	
	function setStateIcon(glyph) {
		document.getElementById('songPlayState').innerText = glyph;
	}
	
	function fadeSongText(element) {
		element.classList.remove('songFade');
		void element.offsetWidth;
		element.classList.add('songFade');
	}
	
	function showTrack(artist, title) {
		const card = widget();
		const wasNoSignal = card.classList.contains('no-signal');
		card.classList.remove('no-signal');
	
		const artistEl = document.getElementById('songArtist');
		const titleEl = document.getElementById('songTitle');
		const changed =
			artistEl.innerText !== artist || titleEl.innerText !== title;
	
		artistEl.innerText = artist;
		titleEl.innerText = title;
	
		if (changed) {
			fadeSongText(artistEl);
			fadeSongText(titleEl);
		}
	
		return wasNoSignal;
	}
	
	function showThumbnail(url) {
		crossfadeBackground(url);
		crossfadeCover(url);
	}
	
	function setTimebarVisible(isVisible) {
		if (isVisible === lastTimebarVisible) return;
		lastTimebarVisible = isVisible;
		document
			.getElementById('musicInfo')
			.classList.toggle('noTimebar', !isVisible);
	}
	
	function updateTimebar(position, duration, force) {
		const sec = Math.floor(position);
		const dur = Math.floor(duration);
	
		if (!force && sec === lastShownSecond && dur === lastShownDuration) {
			return;
		}
		lastShownSecond = sec;
		lastShownDuration = dur;
	
		document.getElementById('songPosition').innerText = formatTime(position);
		document.getElementById('songDuration').innerText = formatTime(duration);
		document.getElementById('songTimebar').style =
			`--player-width: ${duration ? (position / duration) * 100 : 0}%;`;
	}
	
	function resetView(idleImage, immediate) {
		lastTimebarVisible = true;
	
		document.getElementById('musicInfo').classList.remove('noTimebar');
		widget().classList.add('no-signal');
		document.getElementById('songTitle').innerText = 'NO SIGNAL';
		document.getElementById('songArtist').innerText = 'nothing playing rn';
		document.getElementById('songPlayState').innerText = '';
		document.getElementById('songPosition').innerText = '--:--';
		document.getElementById('songDuration').innerText = '--:--';
		document.getElementById('songTimebar').style = '--player-width: 0%;';
	
		crossfadeBackground(idleImage, immediate);
		crossfadeCover(idleImage, immediate);
	}

	app.mediaView = {
		formatTime: formatTime,
		isNoSignal: isNoSignal,
		setStateIcon: setStateIcon,
		showTrack: showTrack,
		showThumbnail: showThumbnail,
		setTimebarVisible: setTimebarVisible,
		updateTimebar: updateTimebar,
		resetView: resetView,
	};
})(window.Lucyd = window.Lucyd || {});
