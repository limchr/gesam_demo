var cid = 'selection_canvas'; // selection canvas id
var cs = 500; // internal canvas pixel size (for calculating background image)
var canvas = null;
var canvas_context = null
var svg = null;

var check_overlay = null;

// specific variables for one generator model visualization
var models = {
	'Drums': {
		'classes': ["tom","kick","snare","hihat","clap"],
		'colors': [
			[255, 102, 102],  // Light Red
			[255, 204, 102],  // Orange
			[255, 255, 102],  // Yellow
			[102, 255, 102],  // Light Green
			[102, 204, 255],  // Light Blue
			[204, 102, 255],  // Purple
			[255, 153, 255],  // Pink
			[153, 153, 153]   // Gray
				],
		'path': 'data/models/drums',
		'num_samples': 200, // number of audio samples for x and y dimension 
		'draw_prerendered_image': true,
		'bg_images': {
			'Energy': 'energy.png',
			'Spectral Bandwidth': 'spectral_bandwidth.png',
			'Spectral Centroid': 'spectral_centroid.png',
			'Spectral Flatness': 'spectral_flatness.png',
			'Spectral Rolloff': 'spectral_rolloff.png',
		},
	}
} 

var active_model = 'Drums';
var active_div = 'classifier_selection';


function change_img(img_path) {
	img = new Image();
	img.src = img_path;
	img.onload = function() {
		set_canvas_image(canvas,canvas_context,this, this.width);
	};
}

document.addEventListener("DOMContentLoaded", function(event) {
	canvas = document.getElementById(cid);
	canvas_context = canvas.getContext('2d');
	svg = document.getElementById('selection_svg');
	let s = square_elem(canvas);
	square_elem(svg, s);
	square_elem(document.getElementById('selection_div'), s);


	check_overlay = document.getElementById('overlaymaps');

	// Get the div where the selection element will be placed
	const feature_selection = document.getElementById('bg_selection');

	// Create the selection element
	const selectElement = document.createElement('select');
	selectElement.id = 'feature_dropdown';

	const bgi = models[active_model]['bg_images'];

	// Fill the selection element with options from the images array
	for (const [key, value] of Object.entries(bgi)) {

		const option = document.createElement('option');
		option.value = value;
		option.text = key;
		selectElement.appendChild(option);
	};

	// Append the selection element to the div
	feature_selection.appendChild(selectElement);


	selectElement.onchange = function() {
		change_feature_image();
	};
	check_overlay.onchange = function() {
		change_feature_image();
	};


	document.getElementById('toggledata').onclick = function() {
		if(document.getElementById('toggledata').checked) {
			display_data_points();
		} else {
			hide_data_points();
		}
	}










	svg.addEventListener('click', e => {
			let mouse_xy = get_mouse_position(e);
			let relative_xy = [(mouse_xy[0]/svg.clientWidth),(mouse_xy[1]/svg.clientHeight)];
			relative_xy = [clamp(relative_xy[0],0.0,0.999), 1-clamp(relative_xy[1],0.0,0.999)];
			let sn = models[active_model].num_samples;
			let square = [Math.floor(relative_xy[0]*sn), Math.floor(relative_xy[1]*sn)];
			let wav_path = models[active_model].path + '/samples/generated_' + pad(square[0], 5) + '_' + pad(square[1], 5) + '.wav';
			console.log(mouse_xy[0] + ' ' + mouse_xy[1] + ' - ' + square[0] + ' ' + square[1] + ' ' + wav_path);
			play_wav(wav_path);

			circle_pos = [relative_xy[0]*2-1, (1-relative_xy[1])*2-1];
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', circle_pos[0]);
			circle.setAttribute('cy', circle_pos[1]);
			circle.setAttribute('r', 0.04); // Set the radius of the circles
			
			circle.setAttribute('fill', 'rgb(100,100,100)');

			// Set the outline or stroke color and width
			circle.setAttribute('stroke', 'black'); // Set the outline color
			circle.setAttribute('stroke-width', 0.002); // Set the outline width



			// Append the circle to the SVG
			svg.appendChild(circle);

			// Define the animation function
			function fadeOut(element, duration) {
				let opacity = 1;
				const start = performance.now();
				
				function animate(currentTime) {
					const elapsed = currentTime - start;
					opacity = 1 - elapsed / duration;
					
					if (opacity <= 0) {
						// Remove the circle when the animation is complete
						svg.removeChild(element);
					} else {
						// Update the opacity
						element.setAttribute('fill-opacity', opacity);
						element.setAttribute('stroke-opacity', opacity);
						// Request the next frame
						requestAnimationFrame(animate);
					}
				}
				
				// Start the animation
				requestAnimationFrame(animate);
			}

			// Call the animation function with the circle element and desired duration
			fadeOut(circle, 1000); // 1000 milliseconds (1 second) for example



		}, true);




	if(models[active_model]['draw_prerendered_image']) {
		let img_path = models[active_model].path+'/map.png';
		change_img(img_path);
	
	}






	//
	// sophisticated js method for drawing
	//

	// load csv file y.csv from server

	let csv_path = models[active_model].path + '/zy.csv';

	// Create an XMLHttpRequest object to load the CSV file
	const xhr = new XMLHttpRequest();
	xhr.open('GET', csv_path, true);

	// Set the callback function to handle the response
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
			const data = parse_csv(xhr.responseText);

			const zx = data.map(d => parseFloat(d[0]));
			const zy = data.map(d => -1 * parseFloat(d[1]));
			const y_numeric = data.map(d => parseInt(d[2]));

			for (let i = 0; i < zx.length; i++) {
				const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				circle.setAttribute('cx', zx[i]);
				circle.setAttribute('cy', zy[i]);
				circle.setAttribute('r', 0.012); // Set the radius of the circles
				
				circle.setAttribute('fill', 'rgb('+models[active_model].colors[y_numeric[i]].join(',')+')');

				// Set the outline or stroke color and width
				circle.setAttribute('stroke', 'black'); // Set the outline color
				circle.setAttribute('stroke-width', 0.002); // Set the outline width



				svg.appendChild(circle);

			}


			// draw background image
			if(!models[active_model]['draw_prerendered_image']) {
				let step_size = canvas.clientWidth/models[active_model].num_samples;

				for (let i=0; i<canvas.clientWidth; i=i+step_size) {
					for (let j=0; j<canvas.clientHeight; j=j+step_size) {
						let xp = (((i+step_size/2)/canvas.clientWidth)*2)-1;
						let yp = (((j+step_size/2)/canvas.clientHeight)*2)-1;

						// get neigherst neighbors of [xp,yp] in zx,zy
						let n_neighbors = 5;
						let nns = [];
						let nns_dist = [];
						for (let k = 0; k < zx.length; k++) {
							let dist = Math.sqrt(Math.pow(xp-zx[k],2)+Math.pow(yp-zy[k],2));
							if(nns.length < n_neighbors) {
								nns.push(k);
								nns_dist.push(dist);
							} else {
								let max_dist = Math.max(...nns_dist);
								if(dist < max_dist) {
									let max_dist_index = nns_dist.indexOf(max_dist);
									nns[max_dist_index] = k;
									nns_dist[max_dist_index] = dist;
								}
							}
						}

						// get mode of nns
						let counts = {};
						let mode = null;
						let max_count = 0;
						for (let k = 0; k < nns.length; k++) {
							let n = y_numeric[nns[k]];
							if(counts[n] == null) counts[n] = 0;
							counts[n] += 1;
							if(counts[n] > max_count) {
								max_count = counts[n];
								mode = n;
							}
						}

						let paint_colors = [];
						let paint_weights = [];
						for (let k=0;k<Object.keys(counts).length;k++) {
							let ind = Object.keys(counts)[k];
							paint_colors.push(models[active_model].colors[ind]);
							paint_weights.push(counts[ind]);
						}
						let mixed_color = mixColors(paint_colors, paint_weights);

						canvas_context.fillStyle = 'rgb('+mixed_color.join(',')+')';
						canvas_context.fillRect(Math.floor(i), Math.floor(j), Math.ceil(step_size), Math.ceil(step_size));
							
					}
				}
			}
		}
	};

	// Send the request to load the CSV file
	xhr.send();

	classesdiv = document.getElementById('classes_div');

	for (let i = 0; i < models[active_model].classes.length; i++) {
		const div = document.createElement('div');
		div.setAttribute('class', 'class_div');
		div.setAttribute('id', 'class_div_' + i);
		div.setAttribute('style', 'background-color: rgb('+models[active_model].colors[i].join(',')+')');
		div.innerHTML = models[active_model].classes[i];
		classesdiv.appendChild(div);
	}

	activateDiv('classifier_selection');


}); // DOMContentLoaded


function display_data_points() {change_data_point_display_mode('initial');}
function hide_data_points() {change_data_point_display_mode('none');}
function change_data_point_display_mode(display_mode) {
	const childElements = svg.querySelectorAll('*');
	childElements.forEach(child => {
		child.style.display = display_mode;
	});
}

function change_feature_image() {
	let file_prefix = 'feature_im_';
	if(check_overlay.checked) {
		file_prefix = 'feature_cim_'
	}
	let img_path = models[active_model].path+'/'+file_prefix+document.getElementById('feature_dropdown').value;
	change_img(img_path);

}

function activateDiv(divId) {
	var divs = document.querySelectorAll('.content-div');
	var selections = document.querySelectorAll('.selection');

	divs.forEach(function(div) {
		if (div.id === divId) {
			div.classList.add('active');
		} else {
			div.classList.remove('active');
		}
	});

	selections.forEach(function(selection) {
		if (selection.nextElementSibling.id === divId) {
			selection.classList.add('active-selection');
		} else {
			selection.classList.remove('active-selection');
		}
	});
	active_div = divId;

	if(active_div == 'classifier_selection') {
		if(document.getElementById('toggledata').checked) {
			display_data_points();
		} else {
			hide_data_points();
		}

		change_img(models[active_model].path+'/'+'map.png');

	} else if (active_div == 'feature_selection') {
		hide_data_points();
		change_feature_image();
	} else if (active_div == 'tsne_selection') {
		hide_data_points();
		change_img(models[active_model].path+'/'+'tsne.png');

	}
}



//
// helper functions
//


function mixColors(colors, weights) {
    if (colors.length !== weights.length) {
        throw new Error("The lengths of the colors and weights arrays must be the same.");
    }
    let totalRed = Number(0);
    let totalGreen = Number(0);
    let totalBlue = Number(0);
	let totalWeights = 0;
	for (let i = 0; i < colors.length; i++) {
        const weight = weights[i];
		totalWeights += weight;
		const [r, g, b] = colors[i];

        // Accumulate the total values by multiplying each channel by the weight
        totalRed += r * weight;
        totalGreen += g * weight;
        totalBlue += b * weight;
    }

    // Calculate the average value for each color channel
    const avgRed = Math.round(totalRed / totalWeights);
    const avgGreen = Math.round(totalGreen / totalWeights);
    const avgBlue = Math.round(totalBlue / totalWeights);

    return [avgRed, avgGreen, avgBlue];
}




// Function to parse CSV data
function parse_csv(csvText) {
	const lines = csvText.split('\n');
	const headers = lines[0].split(',');
	let data = [];
	for (let i = 0; i < lines.length; i++) {
		let values = lines[i].split(',');
		if(values.length != headers.length) continue;
		for (let j = 0; j < headers.length; j++) {
			values[j] = values[j].trim();
		}
		data.push(values);
	}

	return data;
}

var download_canvas = function(){
	var link = document.createElement('a');
	link.download = 'latent_space.png';
	link.href = canvas.toDataURL()
	link.click();
  }


function play_wav(path) {
  var audio = new Audio(path);
  audio.play();
}

// make html element squared in shape (s is side length (width and height, if null use width of passed element))
function square_elem(elem, s=null) {
    if(s==null) s = elem.clientWidth; // offsetWidth for adding the 2px borders
	elem.style.width = s+'px';
	elem.style.height = s+'px';

	// for canvases 'internal size' (html is so weired sometimes)
	elem.width = s;
	elem.height = s;

	return s;
}

//change canvas image
function set_canvas_image(canvas, context, image, csize) {
	context.drawImage(image, 0, 0, csize, csize, 0, 0, canvas.clientWidth, canvas.clientHeight);
}


// padding numbers with trailing 0's
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
// padding numbers with appending 0's
function pada(num, size) {
    var s = num+"";
    while (s.length < size) s =  s+"0";
    return s;
}

// clamp numeric value
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

// get mouse position on canvas
function get_mouse_position(e) {
  let element = e.target, offsetX = 0, offsetY = 0, mx, my;
  while(element !== null) {
	if (element.offsetParent !== undefined) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
		break;
	}
	element = element.parentNode;
  }
  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  return [mx,my];
}

