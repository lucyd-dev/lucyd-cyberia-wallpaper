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

	const { values: props } = app.props;
	const { MEDIA_RESET_DELAY } = app.constants;
	const { registerLoop } = app.loop;
	const view = app.mediaView;

	// Media state machine. Wallpaper Engine fires a burst of events while a track
	// changes, so stop signals are debounced and ignored while a new title or
	// cover is already on its way.
	
	
	const wmi = window.wallpaperMediaIntegration;
	
	let state = wmi.PLAYBACK_PLAYING;
	let iconState = wmi.PLAYBACK_PLAYING;
	let position = 0;
	let duration = 0;
	let basePosition = 0;
	let lastTimelineUpdate = 0;
	let resetTimer = null;
	let mediaVersion = 0;
	
	function idleImage() {
		return props.general.imgPath || 'assets/default-background.jpg';
	}
	
	function setIcon() {
		if (view.isNoSignal()) return;
	
		if (iconState === wmi.PLAYBACK_PLAYING) {
			view.setStateIcon('▶');
		} else if (iconState === wmi.PLAYBACK_PAUSED) {
			view.setStateIcon('⏸');
		} else {
			view.setStateIcon('');
		}
	}
	
	function queueMediaUpdate(callback) {
		cancelReset();
	
		if (state === wmi.PLAYBACK_STOPPED && view.isNoSignal()) {
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
		}, MEDIA_RESET_DELAY);
	}
	
	function applyTrack(artist, title) {
		cancelReset();
	
		const wasNoSignal = view.showTrack(artist, title);
		if (wasNoSignal) {
			state = wmi.PLAYBACK_PLAYING;
			iconState = wmi.PLAYBACK_PLAYING;
		}
	
		setIcon();
	}
	
	function resetMediaWidget(immediate) {
		cancelReset();
	
		state = wmi.PLAYBACK_STOPPED;
		iconState = wmi.PLAYBACK_STOPPED;
		position = 0;
		duration = 0;
	
		view.resetView(idleImage(), immediate);
	}
	
	function tick() {
		if (state !== wmi.PLAYBACK_PLAYING) {
			lastTimelineUpdate = Date.now();
			return;
		}
	
		if (view.isNoSignal()) {
			lastTimelineUpdate = Date.now();
			return;
		}
	
		const elapsed = (Date.now() - lastTimelineUpdate) / 1000;
		let newPos = basePosition + elapsed;
		if (newPos > duration) newPos = duration;
		position = newPos;
	
		view.setTimebarVisible(position < duration && duration !== 0);
		view.updateTimebar(position, duration);
	}
	
	function initMedia() {
		window.wallpaperRegisterMediaStatusListener((event) => {
			if (!event.enabled) return;
			if (!view.isNoSignal()) return;
	
			scheduleReset();
		});
	
		window.wallpaperRegisterMediaPropertiesListener((event) => {
			if (event.contentType === '') {
				scheduleReset();
				return;
			}
	
			mediaVersion += 1;
			queueMediaUpdate(() => applyTrack(event.artist, event.title));
		});
	
		window.wallpaperRegisterMediaThumbnailListener((event) => {
			const thumbnail = event.thumbnail;
			if (thumbnail === '' || thumbnail === 'data:image/png;base64,') return;
	
			mediaVersion += 1;
			queueMediaUpdate(() => view.showThumbnail(thumbnail));
		});
	
		window.wallpaperRegisterMediaPlaybackListener((event) => {
			state = event.state;
	
			if (state === wmi.PLAYBACK_STOPPED) {
				scheduleReset();
				return;
			}
	
			iconState = state;
			cancelReset();
			setIcon();
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
				view.updateTimebar(position, duration, true);
			}
		});
	
		registerLoop('mediaTimer', tick);
	
		resetMediaWidget(true);
	}

	app.media = {
		init: initMedia,
	};
})(window.Lucyd = window.Lucyd || {});
