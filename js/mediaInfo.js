/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const wmi = window.wallpaperMediaIntegration;
let state = wmi.PLAYBACK_PLAYING;
let position = 0;
let duration = 0;
let basePosition = 0;
let lastTimelineUpdate = 0;
let lastShownSecond = -1;
let lastShownDuration = -1;
let lastTimebarVisible = null;

window.wallpaperRegisterMediaStatusListener((event) => {
	if (!event.enabled) return;

	resetMediaWidget();
});
window.wallpaperRegisterMediaPropertiesListener((event) => {
	if (event.contentType === '') {
		resetMediaWidget();
		return;
	}

	timeoutIfNotPlaying(() => setMediaInfo(event.artist, event.title));
});
window.wallpaperRegisterMediaThumbnailListener((event) => {
	const thumbnail = event.thumbnail;
	if (thumbnail === '' || thumbnail === 'data:image/png;base64,') return;

	timeoutIfNotPlaying(() => setMediaThumbnail(thumbnail));
});
window.wallpaperRegisterMediaPlaybackListener((event) => {
	state = event.state;
	if (state === wmi.PLAYBACK_STOPPED) resetMediaWidget();
	setStateIcon();
});
window.wallpaperRegisterMediaTimelineListener((event) => {
	if (event.position > event.duration) {
		position = 0;
		duration = 0;
		return;
	}

	position = event.position;
	duration = event.duration;
	basePosition = event.position;
	lastTimelineUpdate = Date.now();

	if (state !== wmi.PLAYBACK_PLAYING) {
		updateTimebar(true);
	}
});

registerLoop('mediaTimer', () => {
	if (state !== wmi.PLAYBACK_PLAYING) {
		lastTimelineUpdate = Date.now();
		return;
	}

	const elapsed = (Date.now() - lastTimelineUpdate) / 1000;
	let newPos = basePosition + elapsed;
	if (newPos > duration) newPos = duration;
	position = newPos;

	setTimebarState(position < duration && duration !== 0);
	updateTimebar();
});

function timeoutIfNotPlaying(callback) {
	if (state !== wmi.PLAYBACK_PLAYING) {
		setTimeout(callback, 500);
		return;
	}

	callback();
}

function formatTime(sec) {
	let dateObj = new Date(0);
	dateObj.setSeconds(sec);
	let timeString = dateObj.toISOString().substring(11, 19);

	return timeString;
}

function setMediaInfo(artist, title) {
	document.getElementById('songArtist').innerText = artist;
	document.getElementById('songTitle').innerText = title;
}

function setMediaThumbnail(thumbnail) {
	document.getElementById('musicWidget').style =
		`background-image: url(${thumbnail});`;
	document.getElementById('songCover').src = thumbnail;
}

function setTimebarState(isVisible) {
	if (isVisible === lastTimebarVisible) return;
	lastTimebarVisible = isVisible;
	document
		.getElementById('musicInfo')
		.classList.toggle('noTimebar', !isVisible);
}

function setStateIcon() {
	let playStateEl = document.getElementById('songPlayState');

	if (state === wmi.PLAYBACK_PLAYING) {
		playStateEl.innerText = '▶';
	} else if (state === wmi.PLAYBACK_PAUSED) {
		playStateEl.innerText = '⏸';
	} else {
		playStateEl.innerText = '⏹';
	}
}

function updateTimebar(force) {
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

function resetMediaWidget() {
	state = wmi.PLAYBACK_STOPPED;
	position = 0;
	duration = 0;

	setTimebarState(false);
	updateTimebar(true);

	document.getElementById('songTitle').innerText = 'nothing playing rn';
	document.getElementById('songArtist').innerText = '*play some good tunes*';
	document.getElementById('musicWidget').style =
		`background-image: url(assets/default-background.jpg);`;
	document.getElementById('songCover').src = 'assets/default-background.jpg';
}
resetMediaWidget();
