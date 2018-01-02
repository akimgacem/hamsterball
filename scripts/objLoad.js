function ObjLoad () {
	
	this.vertices = [];
	this.textures = [];
	this.faces = [];
	
	this.fileName = "";
	
	this.loadObject = function loadObject(fileName) {
		
		this.fileName = fileName;
		
		var text = new XMLHttpRequest();
		text.open("GET", this.fileName, true);
		text.onreadystatechange = function() {
			if(text.readyState == 4 && text.status == 200) {
				var lines = text.responseText.split("\n");
				
				var line = "";
				for(i = 0; i < lines.length; i++) {
					line = lines[i];
					
					if(/[ ]*/.test(line)) {
						continue;
					}
					
					var commentIndex = line.indexOf("#");
					if(commentIndex >= 0) {
						line = line.substring(0, commentIndex);
					}
					
					var data = "";
					var patternV = /[ ]*v[ ]+(\d+\.?\d*[ ]+\d+\.?\d*[ ]+\d+\.?\d*)/;
					var patternT = /[ ]*vt[ ]+(\d+\.?\d*[ ]+\d+\.?\d*[ ]+\d+\.?\d*)/;
					var patternF = /[ ]*f[ ]+((\d+\/\d+[ ]+){2,}\d+\/\d+)/;
					var digit = /\d+\.?\d*/g;
					if(patternV.test(line)) {
						//vertex
						data = line.match(digit);
						var numbers = [];
						for(i = 0; i < 3; i++) {
							numbers.push(parseFloat(data[i]));
						}
						this.vertices.push(numbers);
					}
					else if(patternT.test(line)) {
						//texture
						data = line.match(patternT);
					}
					else if(patternF.test(line)) {
						//face
						var digits = /\d+(\/\d*){0,2}/g;
						data = line.match(digits);
						var numbers = [];
						var vertexNums = [];
						for(i = 0; i < data.length; i++) {
							vertexNums.push(parseInt(data[i]) - 1);
						}
						numbers.push(this.vertices[vertexNums[0]]);
						numbers.push(this.vertices[vertexNums[1]]);
						numbers.push(this.vertices[vertexNums[2]]);
						this.faces.push(numbers);
						if(vertexNums.length == 4) {
							//quad
							var numbers = [];
							numbers.push(this.vertices[vertexNums[0]]);
							numbers.push(this.vertices[vertexNums[2]]);
							numbers.push(this.vertices[vertexNums[3]]);
							this.faces.push(numbers);
						}
					}
				}
			}
		}
		
		text.send(null);
	}
	
	this.toArrayBuffer = function toArrayBuffer() {
		var arrayBuffer = [];
		for(i = 0; i < this.faces; i++) {
			arrayBuffer.push(this.faces[i][0]);
			arrayBuffer.push(this.faces[i][1]);
			arrayBuffer.push(this.faces[i][2]);
		}
		return arrayBuffer;
	}
	
	
}









