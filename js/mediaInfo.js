/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const wmi = window.wallpaperMediaIntegration;
const RESET_DELAY = 1200;
const FADE_DURATION = 480;

let state = wmi.PLAYBACK_PLAYING;
let iconState = wmi.PLAYBACK_PLAYING;
let position = 0;
let duration = 0;
let basePosition = 0;
let lastTimelineUpdate = 0;
let lastShownSecond = -1;
let lastShownDuration = -1;
let lastTimebarVisible = null;
let resetTimer = null;
let mediaVersion = 0;
let backgroundTimer = null;
let backgroundToken = 0;
let coverTimer = null;
let coverToken = 0;

window.wallpaperRegisterMediaStatusListener((event) => {
	if (!event.enabled) return;

	const widget = document.getElementById('musicWidget');
	if (!widget.classList.contains('no-signal')) return;

	scheduleReset();
});
window.wallpaperRegisterMediaPropertiesListener((event) => {
	if (event.contentType === '') {
		scheduleReset();
		return;
	}

	mediaVersion += 1;
	queueMediaUpdate(() => setMediaInfo(event.artist, event.title));
});
window.wallpaperRegisterMediaThumbnailListener((event) => {
	const thumbnail = event.thumbnail;
	if (thumbnail === '' || thumbnail === 'data:image/png;base64,') return;

	mediaVersion += 1;
	queueMediaUpdate(() => setMediaThumbnail(thumbnail));
});
window.wallpaperRegisterMediaPlaybackListener((event) => {
	state = event.state;

	if (state === wmi.PLAYBACK_STOPPED) {
		scheduleReset();
		return;
	}

	iconState = state;
	cancelReset();
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

	if (
		document.getElementById('musicWidget').classList.contains('no-signal')
	) {
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

function queueMediaUpdate(callback) {
	cancelReset();

	const isShowingNoSignal = document
		.getElementById('musicWidget')
		.classList.contains('no-signal');

	if (state === wmi.PLAYBACK_STOPPED && isShowingNoSignal) {
		setTimeout(callback, 500);
		return;
	}

	callback();
}

function cancelReset() {
	if (resetTimer === null) return;

	clearTimeout(resetTimer);
	resetTimer = null;
}

function scheduleReset() {
	const version = mediaVersion;

	clearTimeout(resetTimer);
	resetTimer = setTimeout(() => {
		resetTimer = null;
		if (version !== mediaVersion) return;

		resetMediaWidget();
	}, RESET_DELAY);
}

function formatTime(sec) {
	let dateObj = new Date(0);
	dateObj.setSeconds(sec);
	let timeString = dateObj.toISOString().substring(11, 19);

	return timeString;
}

function setMediaInfo(artist, title) {
	cancelReset();

	const widget = document.getElementById('musicWidget');
	const wasNoSignal = widget.classList.contains('no-signal');
	widget.classList.remove('no-signal');

	if (wasNoSignal) {
		state = wmi.PLAYBACK_PLAYING;
		iconState = wmi.PLAYBACK_PLAYING;
	}

	setStateIcon();

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
}

function fadeSongText(element) {
	element.classList.remove('songFade');
	void element.offsetWidth;
	element.classList.add('songFade');
}

function setMediaThumbnail(thumbnail) {
	crossfadeBackground(thumbnail);
	crossfadeCover(thumbnail);
}

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
	}, FADE_DURATION);
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
		}, FADE_DURATION);
	};
	preload.src = url;
}

function setTimebarState(isVisible) {
	if (isVisible === lastTimebarVisible) return;
	lastTimebarVisible = isVisible;
	document
		.getElementById('musicInfo')
		.classList.toggle('noTimebar', !isVisible);
}

function setStateIcon() {
	const playStateEl = document.getElementById('songPlayState');

	if (
		document.getElementById('musicWidget').classList.contains('no-signal')
	) {
		playStateEl.innerText = '';
		return;
	}

	if (iconState === wmi.PLAYBACK_PLAYING) {
		playStateEl.innerText = '▶';
	} else if (iconState === wmi.PLAYBACK_PAUSED) {
		playStateEl.innerText = '⏸';
	} else {
		playStateEl.innerText = '';
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

function resetMediaWidget(immediate) {
	cancelReset();

	state = wmi.PLAYBACK_STOPPED;
	iconState = wmi.PLAYBACK_STOPPED;
	position = 0;
	duration = 0;
	lastTimebarVisible = true;

	document.getElementById('musicInfo').classList.remove('noTimebar');
	document.getElementById('musicWidget').classList.add('no-signal');
	document.getElementById('songTitle').innerText = 'NO SIGNAL';
	document.getElementById('songArtist').innerText = 'nothing playing rn';
	document.getElementById('songPlayState').innerText = '';
	document.getElementById('songPosition').innerText = '--:--';
	document.getElementById('songDuration').innerText = '--:--';
	document.getElementById('songTimebar').style = '--player-width: 0%;';

	const idleImage = PROPS.general.imgPath || 'assets/default-background.jpg';
	crossfadeBackground(idleImage, immediate);
	crossfadeCover(idleImage, immediate);
}
resetMediaWidget(true);
