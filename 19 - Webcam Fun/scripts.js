const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
const controls = document.querySelector('.rgb');
const effectType = ['normal', 'red', 'contrast', 'grayscale', 'flip', 'mirror', 'split', 'filter'];
let effectIndex = 0;

function getVideo() {
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	})
		.then(localMediaStream => {
			// srcObject 研究一下
			video.srcObject = localMediaStream;
			// window.URL.createObjectUrl 研究一下
			video.play();
		})
		.catch(err => {
			console.error('Oh No!!', err);
		});
}

function paintToCanvas() {
	const width = video.videoWidth;
	const height = video.videoHeight;
	console.log( width , height)
	canvas.width = width;
	canvas.height = height;

	return window.requestAnimationFrame(timestamp => {
		updateVideo(timestamp, width, height);
	});
}

function updateVideo(timestamp, width, height) {
	ctx.drawImage(video, 0, 0, width, height);

	let pixels = ctx.getImageData(0, 0, width, height);
	controls.style.display = 'none';


	switch(effectType[effectIndex]) {
		case 'red':
			pixels = redEffect(pixels);
			break;
		case 'contrast':
			pixels = contrast(pixels);
			break;
		case 'grayscale':
			pixels = grayscale(pixels);
			break;
		case 'flip':
			pixels = horizontalFlip(pixels, width, height);
			break;
		case 'mirror':
			pixels = mirror(pixels, width, height);
			break;
		case 'split':
			pixels = rgbSplit(pixels);
			break;
		case 'filter':
			controls.style.display = 'block';
			pixels = greenScreen(pixels);
			break;
		default:
			pixels = ctx.getImageData(0, 0, width, height);
			break;
	}
	// pixels = redEffect(pixels);
	// pixels = contrast(pixels);
	// pixels = grayscale(pixels);
	// pixels = mirror(pixels, width, height);
	// pixels = horizontalFlip(pixels, width, height);
	// pixels = rgbSplit(pixels);
	// ctx.globalAlpha = 0.5;
	// pixels = greenScreen(pixels);

	ctx.putImageData(pixels, 0, 0);
	window.requestAnimationFrame(timestamp => {
		updateVideo(timestamp, width, height);
	})
}

function takePhoto() {
	// played the sound
	snap.currentTime = 0;
	snap.play();

	// take the data out of canvas
	const data = canvas.toDataURL('image/jpeg');

	const link = document.createElement('a');
	link.href = data;
	link.setAttribute('download', 'handsome');
	link.innerHTML = `<img src=${data} alt="selfy">`;
	strip.insertBefore(link, strip.firstChild);
}

function switchEffect() {
	effectIndex = (effectIndex + 1) % 8;
	console.log(effectIndex)
}

function redEffect(pixels) {
	for(let i = 0; i < pixels.data.length; i+=4) {
		pixels.data[i] += 100;// red
		pixels.data[i + 1] -= 100; // green
		pixels.data[i + 2] *= 0.1; // blue
	}
	return pixels;
}

function contrast(pixels) {
	for(let i = 0; i < pixels.data.length; i+=4) {
		pixels.data[i] = 255 - pixels.data[i];// red
		pixels.data[i + 1] = 255 - pixels.data[i + 1]; // green
		pixels.data[i + 2] = 255 - pixels.data[i + 2]; // blue
	}
	return pixels;
}

function grayscale(pixels) {
	for(let i = 0; i < pixels.data.length; i+=4) {
		let avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
		pixels.data[i] = avg;// red
		pixels.data[i + 1] = avg; // green
		pixels.data[i + 2] = avg; // blue
	}
	return pixels;
}

function mirror(pixels, width, height) {
	for(let i = 0; i < pixels.data.length; i+=4) {
		let iMirror = (width - ((i / 4) % width)) * 4 + Math.floor(i / 4 / width) * 4 * width;
		pixels.data[i] = pixels.data[iMirror];// red
		pixels.data[i + 1] = pixels.data[iMirror + 1]; // green
		pixels.data[i + 2] = pixels.data[iMirror + 2]; // blue
	}
	return pixels;	
}

function horizontalFlip(pixels, width, height) {
	let newPixels = [];
	for(let i = 0; i < pixels.data.length; i+=4) {
		let iMirror = (width - ((i / 4) % width)) * 4 + Math.floor(i / 4 / width) * 4 * width;
		newPixels[i] = pixels.data[iMirror];// red
		newPixels[i + 1] = pixels.data[iMirror + 1]; // green
		newPixels[i + 2] = pixels.data[iMirror + 2]; // blue
		newPixels[i + 3] = 255; // opacity
	}
	for(let j = 0; j < newPixels.length; j++) {
		pixels.data[j] = newPixels[j];
	}
	return pixels;
}

function rgbSplit(pixels) {
	for(let i = 0; i < pixels.data.length; i+=4) {
		pixels.data[i - (640 * 40 + 80) * 4 + 1] = pixels.data[i];// red
		pixels.data[i + (640 * 60 - 60) * 4 + 1] = pixels.data[i + 1]; // green
		pixels.data[i - (640 * 80 + 40) * 4 + 1] = pixels.data[i + 2]; // blue
	}
	return pixels;
}

function greenScreen(pixels) {
  const levels = {};

  document.querySelectorAll('.rgb input').forEach((input) => {
    levels[input.name] = input.value;
  });

  for (i = 0; i < pixels.data.length; i+=4) {
    red = pixels.data[i + 0];
    green = pixels.data[i + 1];
    blue = pixels.data[i + 2];
    alpha = pixels.data[i + 3];

    if (red >= levels.rmin
      && green >= levels.gmin
      && blue >= levels.bmin
      && red <= levels.rmax
      && green <= levels.gmax
      && blue <= levels.bmax) {
      // take it out!
      pixels.data[i + 3] = 0;
    }
  }

  return pixels;
}



getVideo();

video.addEventListener('canplay', paintToCanvas)