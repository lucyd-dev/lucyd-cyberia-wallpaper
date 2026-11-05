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
	const { numToRGBA } = app.color;

	// Writes the current property set into the DOM and keeps it in localStorage.
	
	
	function applyProperties() {
		localStorage.setItem('PROPS', JSON.stringify(props));
	
		document
			.getElementsByClassName('overlay')[0]
			.classList.toggle('spacingTaskbar', props.general.taskbar);
	
		document.body.style = `--primary: ${numToRGBA(props.general.primary)}; --secondary: ${numToRGBA(props.general.secondary)};`;
		document.getElementById('title').dataset.text =
			props.general.title.toUpperCase();
		document.querySelector('.sideCaption').innerText =
			`${props.general.title || 'Lucyd'} · Cyberia · 2026`;
	
		const sessionName = `${props.terminal.host}@${props.terminal.systemname}`;
		document.querySelectorAll('.termUser').forEach((element) => {
			element.innerText = sessionName;
		});
	
		document.getElementById('os').innerText = props.terminal.os;
		document.getElementById('version').innerText = props.terminal.version;
		document.getElementById('shell').innerText = props.terminal.shell;
		document.getElementById('terminal').innerText = props.terminal.terminal;
		document.getElementById('resolution').innerText =
			props.terminal.resolution;
		document.getElementById('cpu').innerText = props.terminal.cpu;
		document.getElementById('gpu').innerText = props.terminal.gpu;
		document.getElementById('customText').innerHTML =
			props.terminal.customtext;
	
		document.getElementById('bgImg').style = `
        background-image: url(${props.general.imgPath});
        background-position: ${props.general.imgPos.x}% ${props.general.imgPos.y}%;
    `;
		document.getElementById('musicInfo').style =
			`background-color: ${numToRGBA(props.general.primary, 0.2)};`;
	}

	app.applyProps = {
		apply: applyProperties,
	};
})(window.Lucyd = window.Lucyd || {});
