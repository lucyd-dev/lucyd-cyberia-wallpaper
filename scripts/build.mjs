/*
 * Project: lucyd-cyberia-wallpaper
 * Copyright (c) 2026 LucydDev
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// The repository root is the wallpaper itself: Wallpaper Engine loads it
// directly from file://, so src/js/main.js loads the classic scripts and
// src/styles/main.css imports the stylesheets.
//
// `npm run build` concatenates and minifies those into dist/, which is the
// folder to copy to the Workshop upload directory.

import { transform } from 'esbuild';
import {
	cp,
	mkdir,
	readFile,
	readdir,
	rm,
	stat,
	writeFile,
	watch as watchFiles,
} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const indexFile = path.join(root, 'index.html');
const stylesEntry = path.join(root, 'src/styles/main.css');
const scriptsEntry = path.join(root, 'src/js/main.js');

const noMinify = process.argv.includes('--no-minify');
const publish = process.argv.includes('--publish');
const watch = process.argv.includes('--watch');

const targetArgument = process.argv
	.find((argument) => argument.startsWith('--target='))
	?.slice('--target='.length);
const publishTarget = targetArgument
	? path.resolve(targetArgument)
	: path.join(root, '..', 'lucyd-cyberia-wallpaper-steam');

const STATIC_DIRS = ['assets', 'fonts'];
const STATIC_FILES = ['project.json', 'preview.gif', 'LICENSE'];

function readBlock(html, name) {
	const startMarker = `<!-- build:${name} -->`;
	const endMarker = `<!-- /build:${name} -->`;
	const start = html.indexOf(startMarker);
	const end = html.indexOf(endMarker);
	if (start === -1 || end === -1) {
		throw new Error(`index.html is missing the ${name} build markers`);
	}
	const from = html.lastIndexOf('\n', start) + 1;
	const to = html.indexOf('\n', end) + 1;
	return { from, to };
}

function replaceBlock(html, name, replacement) {
	const block = readBlock(html, name);
	return html.slice(0, block.from) + replacement + html.slice(block.to);
}

async function readStylesheets() {
	const entry = await readFile(stylesEntry, 'utf8');
	const imports = [...entry.matchAll(/@import\s+'([^']+)';/g)].map(
		(match) => match[1].replace(/^\.\//, ''),
	);
	if (!imports.length) {
		throw new Error('src/styles/main.css has no @import statements');
	}
	return imports.map((file) => path.join(root, 'src/styles', file));
}

async function readScripts() {
	const entry = await readFile(scriptsEntry, 'utf8');
	const manifest = entry.match(/const files = \[([\s\S]*?)\];/);
	if (!manifest) {
		throw new Error('src/js/main.js has no `const files = [...]` manifest');
	}
	const files = [...manifest[1].matchAll(/'([^']+)'/g)].map(
		(match) => match[1],
	);
	if (!files.length) {
		throw new Error('the manifest in src/js/main.js is empty');
	}
	return files.map((file) => path.join(root, 'src/js', file));
}

async function assertAllScriptsListed() {
	const files = [];
	async function walk(directory) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const full = path.join(directory, entry.name);
			if (entry.isDirectory()) await walk(full);
			else if (entry.name.endsWith('.js')) files.push(full);
		}
	}
	await walk(path.join(root, 'src/js'));

	const listed = new Set(await readScripts());
	const missing = files.filter(
		(file) => file !== scriptsEntry && !listed.has(file),
	);
	if (missing.length) {
		throw new Error(
			`not loaded by src/js/main.js: ${missing
				.map((file) => path.relative(root, file))
				.join(', ')}`,
		);
	}
}

// esbuild leaves template literal contents untouched, so the GLSL sources stay
// multi-line. Collapse them separately: strip comments, put preprocessor
// directives on their own line and join the rest with single spaces.
function compressShader(source) {
	const lines = source.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n');
	const parts = [];
	let buffer = [];

	const flush = () => {
		if (!buffer.length) return;
		parts.push(buffer.join(' ').replace(/[ \t]+/g, ' ').trim());
		buffer = [];
	};

	for (const raw of lines) {
		const line = raw.replace(/\/\/.*$/, '').trim();
		if (!line) continue;

		if (line.startsWith('#')) {
			flush();
			parts.push(line);
		} else {
			buffer.push(line);
		}
	}

	flush();
	return parts.filter(Boolean).join('\n');
}

function compressShaderLiterals(code) {
	return code.replace(/`([^`\\]*(?:\\.[^`\\]*)*)`/g, (match, body) => {
		const isShader =
			body.includes('void main') ||
			body.includes('gl_FragColor') ||
			body.includes('gl_Position') ||
			body.includes('precision highp float');
		return isShader ? `\`${compressShader(body)}\`` : match;
	});
}

async function buildOnce() {
	const html = await readFile(indexFile, 'utf8');
	const styles = await readStylesheets();
	const scripts = await readScripts();
	await assertAllScriptsListed();

	await rm(dist, { recursive: true, force: true });
	await mkdir(path.join(dist, 'js'), { recursive: true });
	await mkdir(path.join(dist, 'styles'), { recursive: true });

	let css = (
		await Promise.all(styles.map((file) => readFile(file, 'utf8')))
	).join('\n');
	// The stylesheets live one level deeper in src/, the built one two levels
	// higher up in the project root.
	css = css
		.replaceAll('../../assets/', '../assets/')
		.replaceAll('../../fonts/', '../fonts/');

	const js = (
		await Promise.all(scripts.map((file) => readFile(file, 'utf8')))
	).join('\n');

	const outputCss = noMinify
		? css
		: (await transform(css, { loader: 'css', minify: true })).code;
	const outputJs = noMinify
		? js
		: (
				await transform(compressShaderLiterals(js), {
					loader: 'js',
					minify: true,
					target: ['chrome110'],
					legalComments: 'none',
				})
			).code;

	await writeFile(path.join(dist, 'styles/main.css'), outputCss);
	await writeFile(path.join(dist, 'js/app.js'), outputJs);

	let outputHtml = replaceBlock(
		html,
		'styles',
		'\t\t<link rel="stylesheet" href="styles/main.css" />\n',
	);
	outputHtml = replaceBlock(
		outputHtml,
		'scripts',
		'\t\t<script type="text/javascript" src="js/app.js"></script>\n',
	);
	await writeFile(path.join(dist, 'index.html'), outputHtml);

	for (const directory of STATIC_DIRS) {
		await cp(path.join(root, directory), path.join(dist, directory), {
			recursive: true,
		});
	}

	for (const file of STATIC_FILES) {
		const source = path.join(root, file);
		try {
			await stat(source);
			await cp(source, path.join(dist, file));
		} catch (error) {
			// Optional file, skip it.
		}
	}

	if (publish) await mirrorToUploadFolder();

	const size = async (file) =>
		`${((await stat(path.join(dist, file))).size / 1024).toFixed(1)} KiB`;
	console.log(
		`dist/js/app.js ${await size('js/app.js')}, dist/styles/main.css ${await size('styles/main.css')}${noMinify ? ' (not minified)' : ''}`,
	);
}

async function mirrorToUploadFolder() {
	await mkdir(publishTarget, { recursive: true });

	for (const directory of ['js', 'styles', 'assets', 'fonts']) {
		await rm(path.join(publishTarget, directory), {
			recursive: true,
			force: true,
		});
	}

	for (const entry of await readdir(dist)) {
		await cp(path.join(dist, entry), path.join(publishTarget, entry), {
			recursive: true,
		});
	}

	console.log(`mirrored into ${publishTarget}`);
}

async function main() {
	await buildOnce();

	if (watch) {
		let timer = null;
		await watchFiles(root, { recursive: true }, (event, file) => {
			if (!file) return;
			if (file.startsWith('dist') || file.startsWith('.git')) return;
			if (!/\.(js|css|html)$/.test(file)) return;

			clearTimeout(timer);
			timer = setTimeout(() => {
				buildOnce().catch((error) => console.error(error.message));
			}, 150);
		});
		console.log('watching src/ and index.html');
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
