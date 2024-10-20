import loadMP4Module, { isWebCodecsSupported } from "https://unpkg.com/mp4-wasm@1.0.6";
console.log(isWebCodecsSupported());
import { vs, fs } from "./shaders.js"

const canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;
document.body.appendChild(canvas);
canvas.class = "fewiojfioew";
canvas.id = "3298";
const gl = canvas.getContext("webgl2", {
	depth: false,
	stencil: false,
	preserveDrawingBuffer: true,
	antialias: false
});
// const bmRenderer = canvas.getContext("bitmaprenderer");

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vs);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fs);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

let status = gl.getProgramParameter(program, gl.LINK_STATUS);
console.log(status);
console.log(gl.getProgramInfoLog(program));
console.log("VERTEX");
console.log(gl.getShaderInfoLog(vertexShader));
console.log("FRAGMENT");
console.log(gl.getShaderInfoLog(fragmentShader));

let iResLoc = gl.getUniformLocation(program, "iResolution");
let camPosLoc = gl.getUniformLocation(program, "cameraPos");
let camRotLoc = gl.getUniformLocation(program, "cameraRot");
let iTimeLoc = gl.getUniformLocation(program, "iTime");

let vertices = new Float32Array([
	-0.5,  1.0,
	 0.0,  1.0,
	 0.0,  0.0,
	 0.0,  0.0,
	-0.5,  0.0,
	-0.5,  1.0,
	
	-1.0,  1.0,
	-0.5,  1.0,
	-0.5,  0.0,
	-0.5,  0.0,
	-1.0,  0.0,
	-1.0,  1.0,
	
	-0.5,  0.0,
	 0.0,  0.0,
	 0.0, -1.0,
	 0.0, -1.0,
	-0.5, -1.0,
	-0.5,  0.0,
	
	-1.0,  0.0,
	-0.5,  0.0,
	-0.5, -1.0,
	-0.5, -1.0,
	-1.0, -1.0,
	-1.0,  0.0,
	
	 0.0,  1.0,
	 0.5,  1.0,
	 0.5,  0.0,
	 0.5,  0.0,
	 0.0,  0.0,
	 0.0,  1.0,
	
	 0.5,  1.0,
	 1.0,  1.0,
	 1.0,  0.0,
	 1.0,  0.0,
	 0.5,  0.0,
	 0.5,  1.0,
	
	 0.0,  0.0,
	 0.5,  0.0,
	 0.5, -1.0,
	 0.5, -1.0,
	 0.0, -1.0,
	 0.0,  0.0,
	
	 0.5,  0.0,
	 1.0,  0.0,
	 1.0, -1.0,
	 1.0, -1.0,
	 0.5, -1.0,
	 0.5,  0.0,
	
	-1.0,  1.0,
	 1.0,  1.0,
	 1.0, -1.0,
	 1.0, -1.0,
	-1.0, -1.0,
	-1.0,  1.0
]);

let vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

let vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);

gl.clearColor(0, 0, 0, 1);

let cameraPos = {
	x: 0,
	y: 0,
	z: 0
};
let cameraRot = {
	x: 0,
	y: 0,
	z: 0
};

let MP4 = loadMP4Module();

async function sleep(t) {
	return new Promise((res, rej) => {
		setTimeout(res, t);
	})
}

// let i = 0;

const show = (data, width, height) => {
  const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
  const video = document.createElement("video");
  video.setAttribute("muted", "muted");
  video.setAttribute("autoplay", "autoplay");
  video.setAttribute("controls", "controls");
  const min = Math.min(width, window.innerWidth, window.innerHeight);
  const aspect = width / height;
  const size = min * 0.75;
  video.style.width = `${size}px`;
  video.style.height = `${size / aspect}px`;

  const container = document.body;
  container.appendChild(video);
  video.src = url;

  const text = document.createElement("div");
  const anchor = document.createElement("a");
  text.appendChild(anchor);
  anchor.href = url;
  anchor.id = "download";
  anchor.textContent = "Click here to download MP4 file...";
  anchor.download = "download.mp4";
  container.appendChild(text);
};

// Utility to download video binary data
const download = (buf, filename) => {
  const url = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "download";
  anchor.click();
};

function downloadPNG(blob, filename) {
	const anchor = document.createElement("a");
	anchor.href = URL.createObjectURL(blob, {type: "image/png"});
	anchor.download = filename;
	anchor.click();
}

async function renderFrame() {
	let frame1 = parseInt(prompt("What Frame?"));
	let frame2 = parseInt(prompt("what Frame?"));
	/*cameraPos.x = 80 * frame / 60;
	cameraPos.y = 60 + 10 * Math.sin(frame * Math.PI / 30);
	cameraPos.z = -100 * frame / 60;
	cameraRot.y = Math.PI + frame * Math.PI / 90;
	cameraRot.x = -Math.PI / 8;*/
	// let encoder = MP4.createWebCodecsEncoder({
		// width: 768,//1920,
		// height: 432,//1080,
		// fps: 60
	// });
	// throw new Error("LOCKED");
	for (let frame = frame1; frame < frame2; frame++) {
		let t = 2 * Math.PI * 0 / 600 + Math.PI / 2;
		cameraPos.x = 121 + 120 * Math.sin(2 * t) * 2;
		cameraPos.y = 120 - 60 * Math.cos(2 * t);
		cameraPos.z = /*-143*/ -174 + 120 * Math.cos(t) * 3.5;
		let dx = 120 * 2 * 2 * Math.cos(2 * t);
		let dz = -120 * 3.5 * Math.sin(t);

		let dy = 100 * Math.sin(2 * t);
		
		cameraRot.y = Math.atan2(dz, dx) - Math.PI / 2;
		cameraRot.x = 2 * Math.atan2(dy, Math.hypot(dz, dx)) - Math.PI / 8;
		// if (cameraRot.x < -1) {
			// console.log(cameraRot.x, dx, dy, dz);
		// }
		let h = (t + Math.PI / 2) / Math.PI;
		h -= Math.floor(h);
		h = h * Math.PI - Math.PI / 2;
		let isRot = h > -0.8 && h < 0.8;
		let a = isRot ? 1 : 0;
		let b = (t + 0.8) % Math.PI * 5/8;
		b = 3 * b * b - 2 * b * b * b;
		b *= 2 * Math.PI;
		cameraRot.z = a * b;

		// console.log(cameraPos, cameraRot);

		// throw new Error("STOP");
		
		gl.uniform3f(iResLoc, canvas.width, canvas.height, 0);
		gl.uniform3f(camPosLoc, cameraPos.x, cameraPos.y, cameraPos.z);
		gl.uniform3f(camRotLoc, cameraRot.x, cameraRot.y, cameraRot.z);
		gl.uniform1f(iTimeLoc, frame / 60);
		
		gl.clear(gl.COLOR_BUFFER_BIT);
		await sleep(1200);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 6, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 12, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 18, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 24, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 30, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 36, 6);
		await sleep(750);
		gl.drawArrays(gl.TRIANGLES, 42, 6);
		await sleep(1500);
		await sleep(200);
		console.log(gl.getError());
		await sleep(500);
		// let bitmap = await createImageBitmap(canvas);
		// await encoder.addFrame(bitmap);
		canvas.toBlob((blob) => {
			downloadPNG(blob, `frame${frame}.png`);
		});
	}

	// const buf = await encoder.end();
	// show(buf, 768, 432);
}

document.getElementById("bruh").addEventListener("click", renderFrame);

async function createVideo() {
	let encoder = MP4.createWebCodecsEncoder({
		width: 1920,
		height: 1080,
		fps: 60
	});
	for (let i = 0; i < 100; i++) {
		let img = new Image();
		img.src = `final_render0/frame${i}.png`;
		function encodeYay() {
			return new Promise((res, rej) => {
				img.onload = async function() {
					console.log(`frame${i}`);
					let bitmap = await createImageBitmap(img);
					await encoder.addFrame(bitmap);
					res();
				}
				img.onerror = async function() {
					console.log(`frame${i} erorr`);
					res();
				};
			});
		}
		await encodeYay();
	}

	const buf = await encoder.end();
	show(buf, 1280, 720);
}

document.getElementById("yes").addEventListener("click", createVideo);

async function mainS() {
	MP4 = await loadMP4Module();
	/*for (let i = 0; i < 60; i++) {
		cameraPos.x = 80 * i / 60;
		cameraPos.y = 30 + 10 * Math.sin(i * Math.PI / 30);
		cameraPos.z = -100 * i / 60;
		cameraRot.y = Math.PI + i * Math.PI / 90;
		cameraRot.x = -Math.PI / 8;
		//await render(i, encoder);
	}*/
	

	//console.log(endT - startT);
	//window.encoder = encoder;
	//globalThis.encoder = encoder;
	//const buf = await encoder.end();
	//window.buf = buf;
	//show(buf, canvas.width, canvas.height);
}
let startT = performance.now();
mainS().then(() => {
	let endT = performance.now();
	console.log(endT - startT);
});

/*// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));
// console.log("n".repeat(100));

let h = 50;
let w = 100;
let buffer = new Array(h);
for (let i = 0; i < buffer.length; i++) {
    buffer[i] = new Array(w);
    for (let j = 0; j < w; j++) {
        buffer[i][j] = 'b';
    }
}

function render() {
    for (let y = 0; y < buffer.length; y++) {
        for (let x = 0; x < w; x++) {
            if (0.36 * (x - w / 2) * (x - w / 2) + (y - h / 2) * (y - h / 2) < 100) {
                if (0.36 * (x - w / 2) * (x - w / 2) + (y - h / 2) * (y - h / 2) > 50) {
                    buffer[y][x] = 'c';
                }
            }
        }
    }
}

function draw() {
    for (let i = 0; i < buffer.length; i++) {
        console.log(buffer[i].join(''));
    }
}

render();
draw();*/