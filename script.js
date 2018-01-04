var canvas;
var gl;
var shaderProgram;


var cubeVertexPositionBuffer;
var cubeVertexNormalBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rMatrix = mat4.create();

var missingTexture;
var metalCrateTexture;
var lgmTexture;
var metalCrateAlphaTexture;
var metalCrate2Texture;

var texturesLoaded = 0;
var totalTextures = 0;

var modelsLoaded = 0;
var totalModels = 0;

var prevTime = 0;

var cubeRotationX = 0.0;
var cubeRotationY = 0.0;
var cubeRotationZ = 0.0;

var cubeRotationXVel = 0.0;
var cubeRotationYVel = 0.0;
var cubeRotationZVel = 0.0;

var keySet = {};

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var clickMouseX = null;
var cliclMouseY = null;

var mouseDiffX = 0;
var mouseDiffY = 0;

var modelInstances = [];

var blending = true;


window.addEventListener("keydown", function(event) {
	if([32, 33, 34, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
		event.preventDefault();
	}
}, false);

function ModelInstance() {
	this.vertexPositionBuffer;
	this.vertexNormalBuffer;
	this.vertexTextureCoordBuffer;
	
	this.texture = null;
	
	this.mvMatrix = mat4.identity(mat4.create());
	
	this.mvMatrix = mat4.translate(this.mvMatrix, [-10.0, 0.0, 0.0]);
	
}

function initGL(canvas) {
	gl = null;
	try {
		gl = canvas.getContext("webgl", {alpha: false}) || canvas.getContext("experimental-webgl");
		gl.vWidth = canvas.width;
		gl.vHeight = canvas.height;
	}
	catch(e) {}
	
	if(!gl) {
		alert("Your browser does not support WebGL.");
	}
	return gl;
}


function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if(!shaderScript) {
		return null;
	}
	
	var shaderSource = "";
	var currentChild = shaderScript.firstChild;
	while(currentChild) {
		if(currentChild.nodeType == 3) {
			shaderSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}
	
	var shader;
	if(shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}
	else if(shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	}
	else {
		return null;
	}
	
	gl.shaderSource(shader, shaderSource);
	
	gl.compileShader(shader);
	
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}


function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");
	
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program.");
	}
	
	gl.useProgram(shaderProgram);
	
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	
	shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform  = gl.getUniformLocation(shaderProgram, "uNMatrix");
	
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
	
	shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
}


function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function initTextures() {
	missingTexture = gl.createTexture();
	missingTexture.image = new Image();
	missingTexture.image.onload = function() {
		handleTextureLoaded(missingTexture);
	};
	missingTexture.image.src = "./textures/missing_texture.png";
	totalTextures++;
	
	
	metalCrateTexture = gl.createTexture();
	metalCrateTexture.image = new Image();
	metalCrateTexture.image.onload = function() {
		handleTextureLoaded(metalCrateTexture);
	};
	metalCrateTexture.image.src = "./textures/metal_crate.jpg";
	totalTextures++;
	
	
	metalCrateAlphaTexture = gl.createTexture();
	metalCrateAlphaTexture.image = new Image();
	metalCrateAlphaTexture.image.onload = function() {
		handleTextureLoaded(metalCrateAlphaTexture);
	};
	metalCrateAlphaTexture.image.src = "./textures/metal_crate_with_alpha.png";
	totalTextures++;
	
	
	lgmTexture = gl.createTexture();
	lgmTexture.image = new Image();
	lgmTexture.image.onload = function() {
		handleTextureLoaded(lgmTexture);
	};
	lgmTexture.image.src = "./textures/lgm.png";
	totalTextures++;
	
	
	metalCrate2Texture = gl.createTexture();
	metalCrate2Texture.image = new Image();
	metalCrate2Texture.image.onload = function() {
		handleTextureLoaded(metalCrate2Texture);
	};
	metalCrate2Texture.image.src = "./textures/metal_crate_2_with_alpha.png";
	totalTextures++;
}

function handleTextureLoaded(texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	texturesLoaded++;
}

function loadModels() {
	var request = new XMLHttpRequest();
	request.open("GET", "./objects/sphere_hamsterball.json");
	request.onreadystatechange = function() {
		if(request.readyState == 4 && request.status == 200) {
			handleLoadedModels(JSON.parse(request.responseText));
		}
	}
	request.send();
	totalModels++;
}

function handleLoadedModels(modelData) {
	modelVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.mVertexNormals), gl.STATIC_DRAW);
	modelVertexNormalBuffer.itemSize = 3;
	modelVertexNormalBuffer.numItems = modelData.mVertexNormals.length / 3;
	
	var texCoords = [];
	for(i = 0; i < modelData.mTextureCoords.length; i += 3) {
		texCoords.push(modelData.mTextureCoords[i]);
		texCoords.push(modelData.mTextureCoords[i+1]);
	}
	
	modelVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	modelVertexTextureCoordBuffer.itemSize = 2;
	modelVertexTextureCoordBuffer.numItems = texCoords.length / 2;
	
	modelVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.mVertexPoints), gl.STATIC_DRAW);
	modelVertexPositionBuffer.itemSize = 3;
	modelVertexPositionBuffer.numItems = modelData.mVertexPoints.length / 3;
	
	modelsLoaded++;
	
	var model = new ModelInstance();
	model.vertexPositionBuffer = modelVertexPositionBuffer;
	model.vertexNormalBuffer = modelVertexNormalBuffer;
	model.vertexTextureCoordBuffer = modelVertexTextureCoordBuffer;
	
	model.texture = gl.createTexture();
	model.texture.image = new Image();
	model.texture.image.onload = function() {
		handleTextureLoaded(model.texture);
	};
	model.texture.image.src = "./objects/" + modelData.texturePath;
	totalTextures++;
	
	modelInstances.push(model);
	
}


function initBuffers() {
	
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	var vertices = [
	-1.0, -1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, 1.0,
	
	-1.0, -1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	
	-1.0, 1.0, -1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	
	-1.0, -1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,
	
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, 1.0, 1.0, 
	1.0, -1.0, 1.0,
	
	-1.0, -1.0, -1.0,
	-1.0, -1.0, 1.0,
	-1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;
	
	
	cubeVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	
	var vertexNormals = [
	0.0, 0.0, 1.0,
	0.0, 0.0, 1.0,
	0.0, 0.0, 1.0,
	0.0, 0.0, 1.0,
	
	0.0, 0.0, -1.0,
	0.0, 0.0, -1.0,
	0.0, 0.0, -1.0,
	0.0, 0.0, -1.0,
	
	0.0, 1.0, 0.0,
	0.0, 1.0, 0.0,
	0.0, 1.0, 0.0,
	0.0, 1.0, 0.0,
	
	0.0, -1.0, 0.0,
	0.0, -1.0, 0.0,
	0.0, -1.0, 0.0,
	0.0, -1.0, 0.0,
	
	1.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	
	-1.0, 0.0, 0.0,
	-1.0, 0.0, 0.0,
	-1.0, 0.0, 0.0,
	-1.0, 0.0, 0.0
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	cubeVertexNormalBuffer.itemSize = 3;
	cubeVertexNormalBuffer.numItems = 24;
	
	
	cubeVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	
	var texCoords = [
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	cubeVertexTextureCoordBuffer.itemSize = 2;
	cubeVertexTextureCoordBuffer.numItems = 24;
	
	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	
	var cubeVertexIndices = [
	0, 1, 2, 0, 2, 3,
	4, 5, 6, 4, 6, 7,
	8, 9, 10, 8, 10, 11,
	12, 13, 14, 12, 14, 15,
	16, 17, 18, 16, 18, 19,
	20, 21, 22, 20, 22, 23
	];
	
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
	
}


function drawScene() {
	
	gl.viewport(0, 0, gl.vWidth, gl.vHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.perspective(45, gl.vWidth / gl.vHeight, 0.1, 100.0, pMatrix);
	
	mat4.identity(mvMatrix);
	
	mat4.translate(mvMatrix, [0.0, 0.0, -10.0]);
	
	mat4.rotateX(mvMatrix, cubeRotationX);
	mat4.rotateY(mvMatrix, cubeRotationY);
	mat4.rotateZ(mvMatrix, cubeRotationZ);
	
	if(mouseDown) {
		mat4.rotateX(mvMatrix, mouseDiffY * Math.PI * 0.5 / 400.0);
		mat4.rotateY(mvMatrix, mouseDiffX * Math.PI * 0.5 / 400.0);
		document.getElementById("mousePositionClickText").innerHTML = "yes";
	}
	else {
		document.getElementById("mousePositionClickText").innerHTML = "no";
	}
	
	
	//ambient light
	gl.uniform3f(shaderProgram.ambientColorUniform,
	0.17, 0.22, 0.32);
	
	//directional light direction
	var lightingDirection = [0.4, -0.7, -0.3];
	
	var adjustedLD = vec3.create();
	vec3.normalize(lightingDirection, adjustedLD);
	vec3.scale(adjustedLD, -1);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
	
	gl.uniform3f(shaderProgram.directionalColorUniform,
	0.9, 0.75, 0.6);
	
	//drawing the metal cube
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
	cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
	cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
	cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, metalCrate2Texture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	
	//drawing all objects that were loaded from disk
	for(i = 0; i < totalModels; i++) {
		
		gl.bindBuffer(gl.ARRAY_BUFFER, modelInstances[i].vertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
		modelInstances[i].vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, modelInstances[i].vertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
		modelInstances[i].vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, modelInstances[i].vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
		modelInstances[i].vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, modelInstances[i].texture);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		
		mvMatrix = modelInstances[i].mvMatrix;
		mvMatrix = mat4.multiply(modelInstances[i].mvMatrix, mvMatrix);
		
		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, modelInstances[i].vertexPositionBuffer.numItems);
		
	}
	
	
}

function animate() {
	var currTime = (new Date()).getTime();
	if(prevTime != 0) {
		var dt = currTime - prevTime;
		
		var speedMult = 10.0;
		var preCalc = dt / 1000 * Math.PI * 2 * speedMult;
		
		cubeRotationX += preCalc * cubeRotationXVel;
		cubeRotationY += preCalc * cubeRotationYVel;
		cubeRotationZ += preCalc * cubeRotationZVel;
		
		document.getElementById("rotationXText").innerHTML = cubeRotationXVel.toFixed(4);
		document.getElementById("rotationYText").innerHTML = cubeRotationYVel.toFixed(4);
		document.getElementById("rotationZText").innerHTML = cubeRotationZVel.toFixed(4);
		
	}
	
	prevTime = currTime;
}

function handleKeyDown(event) {
	keySet[event.keyCode] = true;
	//alert("A key with keyCode " + event.keyCode + " has been pressed.");
}

function handleKeyUp(event) {
	keySet[event.keyCode] = false;
}

function handleKeys() {
	if(keySet[38]) { //up arrow
		cubeRotationXVel -= 0.0001;
	}
	if(keySet[40]) { //down arrow
		cubeRotationXVel += 0.0001;
	}
	if(keySet[37]) { //left arrow
		cubeRotationYVel -= 0.0001;
	}
	if(keySet[39]) { //right arrow
		cubeRotationYVel += 0.0001;
	}
	if(keySet[33]) { //page up
		cubeRotationZVel -= 0.0001;
	}
	if(keySet[34]) { //page down
		cubeRotationZVel += 0.0001;
	}
}

function handleMouseDown(event) {
	mouseDown = true;
	clickMouseX = event.clientX;
	clickMouseY = event.clientY;
	
	//lastMouseX = event.clientX;
	//lastMouseY = event.clientY;
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleMouseMove(event) {
	if(!mouseDown) return;
	
	mouseDiffX = event.clientX - clickMouseX;
	mouseDiffY = event.clientY - clickMouseY;
	
	document.getElementById("mousePositionXText").innerHTML = "" + mouseDiffX;
	document.getElementById("mousePositionYText").innerHTML = "" + mouseDiffY;
	
	//TODO
}


function start() {
	canvas = document.getElementById("canvas");
	gl = initGL(canvas);
	
	if(gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.depthFunc(gl.LEQUAL);
		
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		initShaders();
		
		initBuffers();
		
		initTextures();
		
		loadModels();
		
		document.onkeydown = handleKeyDown;
		document.onkeyup   = handleKeyUp;
		
		canvas.onmousedown = handleMouseDown;
		document.onmouseup = handleMouseUp;
		document.onmousemove = handleMouseMove;
		
		setInterval(function() {
			if(texturesLoaded == totalTextures && modelsLoaded == totalModels) {
				requestAnimationFrame(animate);
				handleKeys();
				drawScene();
			}
		}, 15);
	}
}












