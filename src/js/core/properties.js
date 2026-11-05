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

	const { setFps } = app.loop;

	// Wallpaper Engine property defaults and the property listener. The listener
	// only mutates `props`; the renderer is applied by the callback handed to
	// `initProperties`, which keeps this module free of DOM side effects.
	
	
	const props = {
		fps: 30,
		general: {
			primary: '0.6313725490196078 0.1450980392156863 1',
			secondary: '1 0 0.8980392156862745',
			taskbar: true,
			title: 'Lucyd',
			imgPath: 'assets/default-background.jpg',
			imgPos: {
				x: 0,
				y: 0,
			},
		},
		terminal: {
			host: 'lucyd',
			systemname: 'homedev',
			os: 'Windows 11 Professional',
			version: '25H2 [64-bit]',
			shell: 'Powershell',
			terminal: 'Windows Terminal',
			resolution: `${window.outerWidth}x${window.outerHeight}`,
			cpu: 'AMD Ryzen 9 9950X3D @ 5.70GHz',
			gpu: 'AMD Radeon RX 7900 XTX',
			customtext:
				'♥ tell something about u or write a poem ♥<br>Use &lt;br&gt; for a line break',
		},
	};
	
	const stored = localStorage.getItem('PROPS');
	if (stored) {
		try {
			Object.assign(props, JSON.parse(stored));
		} catch (error) {
			localStorage.removeItem('PROPS');
		}
	}
	
	function initProperties(onChange) {
		window.addEventListener('resize', () => {
			props.terminal.resolution = `${window.outerWidth}x${window.outerHeight}`;
			const resolution = document.getElementById('resolution');
			if (resolution) resolution.innerText = props.terminal.resolution;
		});
	
		window.wallpaperPropertyListener = {
			applyGeneralProperties: (properties) => {
				if (properties.fps) {
					props.fps = properties.fps;
					setFps(properties.fps);
				}
			},
			applyUserProperties: (properties) => {
				if (properties.primary) {
					props.general.primary = properties.primary.value;
				}
	
				if (properties.secondary) {
					props.general.secondary = properties.secondary.value;
				}
	
				if (properties.taskbarspacing) {
					props.general.taskbar = properties.taskbarspacing.value;
				}
	
				if (properties.title) {
					props.general.title = properties.title.value;
				}
	
				if (properties.image) {
					if (properties.image.value !== '') {
						props.general.imgPath = 'file:///' + properties.image.value;
					} else {
						props.general.imgPath = 'assets/default-background.jpg';
					}
				}
	
				if (properties.imageposx) {
					props.general.imgPos.x = properties.imageposx.value;
				}
	
				if (properties.imageposy) {
					props.general.imgPos.y = properties.imageposy.value;
				}
	
				if (properties.host) {
					props.terminal.host = properties.host.value;
				}
	
				if (properties.systemname) {
					props.terminal.systemname = properties.systemname.value;
				}
	
				if (properties.os) {
					props.terminal.os = properties.os.value;
				}
	
				if (properties.version) {
					props.terminal.version = properties.version.value;
				}
	
				if (properties.shell) {
					props.terminal.shell = properties.shell.value;
				}
	
				if (properties.terminal) {
					props.terminal.terminal = properties.terminal.value;
				}
	
				if (properties.cpu) {
					props.terminal.cpu = properties.cpu.value;
				}
	
				if (properties.gpu) {
					props.terminal.gpu = properties.gpu.value;
				}
	
				if (properties.customtext) {
					props.terminal.customtext = properties.customtext.value;
				}
	
				props.terminal.resolution = `${window.outerWidth}x${window.outerHeight}`;
	
				onChange();
			},
		};
	}

	app.props = {
		values: props,
		init: initProperties,
	};
})(window.Lucyd = window.Lucyd || {});
