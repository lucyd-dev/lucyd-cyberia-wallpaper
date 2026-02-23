/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const PROPS = {
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
        customtext: '♥ tell something about u or write a poem ♥<br>Use &lt;br&gt; for a line break'
	}
	
};

if (localStorage.getItem('PROPS')) {
    const savedProps = JSON.parse(localStorage.getItem('PROPS'));
    Object.assign(PROPS, savedProps);
}

window.addEventListener('load', () => {
    applyProperties();
});

window.addEventListener('resize', () => {
	PROPS.terminal.resolution = `${window.outerWidth}x${window.outerHeight}`;
    
    applyProperties();
});

window.wallpaperPropertyListener = {
    applyGeneralProperties: (properties) => {
        if (properties.fps)
            PROPS.fps = properties.fps;
    },
    applyUserProperties: (properties) => {      
        if (properties.primary)
            PROPS.general.primary = properties.primary.value;
        
        if (properties.secondary)
            PROPS.general.secondary = properties.secondary.value;
        
        if (properties.taskbarspacing)
            PROPS.general.taskbar = properties.taskbarspacing.value;
        
        if (properties.title)
            PROPS.general.title = properties.title.value;
        
        if (properties.image) {
            if (properties.image.value != "") {
                PROPS.general.imgPath = 'file:///' + properties.image.value;
            } else {
                PROPS.general.imgPath = 'assets/default-background.jpg';
            }
        }
		
		if (properties.imageposx)
			PROPS.general.imgPos.x = properties.imageposx.value;
		
		if (properties.imageposy)
			PROPS.general.imgPos.y = properties.imageposy.value;
		
        if (properties.host)
            PROPS.terminal.host = properties.host.value;
		
        if (properties.systemname)
            PROPS.terminal.systemname = properties.systemname.value;
		
        if (properties.os)
            PROPS.terminal.os = properties.os.value;
		
        if (properties.version)
            PROPS.terminal.version = properties.version.value;
		
        if (properties.shell)
            PROPS.terminal.shell = properties.shell.value;
		
        if (properties.terminal)
            PROPS.terminal.terminal = properties.terminal.value;
		
        if (properties.cpu)
            PROPS.terminal.cpu = properties.cpu.value;
		
        if (properties.gpu)
            PROPS.terminal.gpu = properties.gpu.value;
        
        if (properties.customtext)
            PROPS.terminal.customtext = properties.customtext.value;
        
        PROPS.terminal.resolution = `${window.outerWidth}x${window.outerHeight}`;
        
        
        applyProperties();
	},
};

function applyProperties() {
    localStorage.setItem('PROPS', JSON.stringify(PROPS));
    
    if (PROPS.general.taskbar) {
        document.getElementsByClassName('overlay')[0].classList.add("spacingTaskbar");
    } else {
        document.getElementsByClassName('overlay')[0].classList.remove("spacingTaskbar");
    }
    
    document.body.style = `--primary: ${numToRGBA(PROPS.general.primary)}; --secondary: ${numToRGBA(PROPS.general.secondary)};`;
    document.getElementById('title').dataset.text = PROPS.general.title.toUpperCase();
    document.getElementById('sessionName').innerText = `${PROPS.terminal.host}@${PROPS.terminal.systemname}`;
    document.getElementById('os').innerText = PROPS.terminal.os;
    document.getElementById('version').innerText = PROPS.terminal.version;
    document.getElementById('shell').innerText = PROPS.terminal.shell;
    document.getElementById('terminal').innerText = PROPS.terminal.terminal;
    document.getElementById('resolution').innerText = PROPS.terminal.resolution;
    document.getElementById('cpu').innerText = PROPS.terminal.cpu;
    document.getElementById('gpu').innerText = PROPS.terminal.gpu;
    document.getElementById('customText').innerHTML = PROPS.terminal.customtext;
    document.getElementById('bgImg').style = `
        background-image: url(${PROPS.general.imgPath});
        background-position: ${PROPS.general.imgPos.x}% ${PROPS.general.imgPos.y}%;
    `;
    document.getElementById('musicInfo').style = `background-color: ${numToRGBA(PROPS.general.primary, 0.2)};`;
}

function numToRGBA(num, alpha = 1) {
    const rgb = numToRGB(num);
    return `rgba(${rgb}, ${alpha})`;
}

function numToRGB(num) {
	return num.split(' ').map((c) => Math.ceil(c * 255));
}
