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

	const { SLOPE_ANGLE } = app.constants;

	// Layout glue for the panel chrome: cuts the image along the slope, keeps the
	// side caption centred on the terminal and redraws the chamfered card borders.
	
	
	function initChrome() {
		const overlay = document.querySelector('.overlay');
		const slope = document.querySelector('.slope');
		const frame = document.getElementById('bgFrame');
		const terminal = document.querySelector('.terminalWidget');
		const caption = document.querySelector('.sideCaption');
		const cards = document.querySelectorAll('.glassFrame');
	
		function fitImage() {
			if (!overlay || !slope || !frame) return;
	
			const height = overlay.clientHeight;
			const imageWidth = frame.clientWidth;
			const left = parseFloat(getComputedStyle(slope).left) || 0;
			const top = Math.min(imageWidth, left + height * Math.tan(SLOPE_ANGLE));
			const bottom = Math.min(imageWidth, left);
	
			const clip = `polygon(0 0, ${top}px 0, ${bottom}px 100%, 0 100%)`;
			frame.style.clipPath = clip;
	
			const matrix = document.getElementById('matrix');
			const glow = document.getElementById('matrixGlow');
			if (matrix) matrix.style.clipPath = clip;
			if (glow) glow.style.clipPath = clip;
		}
	
		function fitCaption() {
			if (!overlay || !terminal || !caption) return;
	
			const box = overlay.getBoundingClientRect();
			const card = terminal.getBoundingClientRect();
			caption.style.top = `${Math.round(card.top - box.top + card.height / 2)}px`;
			caption.style.transform = 'translateY(-50%)';
		}
	
		function fitBorders() {
			cards.forEach((card) => {
				const svg = card.querySelector('.frameBorder');
				if (!svg) return;
	
				const width = card.clientWidth;
				const height = card.clientHeight;
				if (!width || !height) return;
	
				const cut =
					parseFloat(getComputedStyle(card).getPropertyValue('--cut')) || 26;
				const path = svg.querySelector('path');
				if (!path) return;
	
				svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
				path.setAttribute(
					'd',
					`M0.5 0.5 H ${width - cut} L ${width - 0.5} ${cut} V ${height - 0.5} H ${cut} L 0.5 ${height - cut} Z`,
				);
			});
		}
	
		function layout() {
			fitImage();
			fitCaption();
			fitBorders();
		}
	
		layout();
	
		if (typeof ResizeObserver !== 'undefined') {
			const observer = new ResizeObserver(layout);
			if (overlay) observer.observe(overlay);
			cards.forEach((card) => observer.observe(card));
		} else {
			window.addEventListener('resize', layout);
		}
	}

	app.chrome = {
		init: initChrome,
	};
})(window.Lucyd = window.Lucyd || {});
