// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec4 a_VertexColor;
  attribute vec2 a_UV;

  uniform vec2 u_selector;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;

  varying vec3 vVertexPos;
  varying vec3 vNormal;
  varying lowp vec4 vColor;
  varying vec2 vUv;
  varying vec2 selector;

  void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    vColor = a_VertexColor;
    vUv = a_UV;
    vNormal = normalize(a_Normal);
    vVertexPos = vec3(u_ModelMatrix * a_Position);
    selector = u_selector;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  uniform sampler2D uTex0;
  uniform sampler2D uTex1;
  uniform int normalVisualization;
  uniform int lighting;
  uniform int spotlight;
  uniform vec3 u_CameraPos;
  uniform vec3 u_CameraDir;
  uniform vec3 u_LightPos;
  uniform vec3 u_lightRGB;

  varying vec3 vVertexPos;
  varying vec3 vNormal;
  varying lowp vec4 vColor;
  varying vec2 vUv;
  varying vec2 selector;

  void main() {
    if (normalVisualization == 0) {
      if (lighting == 1) {
        vec3 camVec = normalize(-u_CameraPos - vVertexPos);
        vec3 lightVec = normalize(u_LightPos - vVertexPos);
        vec4 image = texture2D(uTex0, vUv)*selector.x;
        image += texture2D(uTex1, vUv)*selector.y;
        float diffuse = max(0.0, dot(vNormal, lightVec)); // diffuse
        float ambient = 0.2; //ambient
        float specular = 1.5 * pow(max(0.0, dot(camVec, reflect(-lightVec, vNormal))), 10.0); //specular
        float lighting = diffuse + ambient + specular;
        if (spotlight == 1) {
          float spot = pow(max(0.0, dot(-camVec, normalize(u_CameraDir))), 10.0) * 2.0;
          lighting += spot * max(0.0, dot(vNormal, normalize(-u_CameraDir))); // diffuse
          lighting += spot * 0.5 * pow(max(0.0, dot(camVec, reflect(normalize(u_CameraDir), vNormal))), 10.0); // specular
        }
        gl_FragColor = vec4(u_lightRGB * lighting * mix(vColor.rgb, image.rgb * image.a, 1.0-vColor.a), 1);
      } else {
        vec4 image = texture2D(uTex0, vUv)*selector.x;
        image += texture2D(uTex1, vUv)*selector.y;
        gl_FragColor = vec4(mix(vColor.rgb, image.rgb * image.a, 1.0-vColor.a), 1);
      }
    } else {
      gl_FragColor = vec4(vNormal, 1.0); 
    }
  }
  `;

let walls = [
  [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
  [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 0, 4],
  [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 1, 1, 1, 5, 0, 3],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 0, 3],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 1, 1, 1, 5, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
];

let heightmap = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, -1, 0, 0, 0, 0],
  [0, 0, 0, -2, -3, -2, -2, -1, 0],
  [0, -1, -1, -1, -2, -3, -1, -3, 0],
  [0, 0, -1, 4, -2, -4, -5, -2, 0],
  [0, 1, 4, 6, 2, -2, -3, 0, 0],
  [0, 1, 2, 1, 0, -1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

let canvas;
let gl;
let display;
let frames;//frames since last fps update
let lastFPSUpdate;//time of last FPS update

let a_Position;
let a_Normal;
let u_LightPos;
let u_lightRGB;
let u_lighting;
let u_spotlight;
let u_CameraPos;
let u_CameraDir;
let u_ModelMatrix;
let viewMatrix = new Matrix4();
let u_ViewMatrix;
let projMatrix = new Matrix4();
let u_ProjMatrix;
let a_VertexColor;
let a_UV;
let u_selector;
let normalVisualization;

let lightPos = [5, 5, 10];
let lightMove = true;

let time;
let objects = [];//list of RenderObjects

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('canvas');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return 1; 
  }

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return 1;
  }

  //gl.enable(gl.BLEND);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  return 0;
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return 1;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return 1;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return 1;
  }

  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  if (!u_LightPos) {
    console.log('Failed to get the storage location of u_LightPos');
    return 1;
  }

  u_lightRGB = gl.getUniformLocation(gl.program, 'u_lightRGB');
  if (!u_lightRGB) {
    console.log('Failed to get the storage location of u_lightRGB');
    return 1;
  }

  u_lighting = gl.getUniformLocation(gl.program, 'lighting');
  if (!u_lighting) {
    console.log('Failed to get the storage location of u_lighting');
    return 1;
  }

  u_spotlight = gl.getUniformLocation(gl.program, 'spotlight');
  if (!u_spotlight) {
    console.log('Failed to get the storage location of u_spotlight');
    return 1;
  }

  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
  if (!u_CameraPos) {
    console.log('Failed to get the storage location of u_CameraPos');
    return 1;
  }

  u_CameraDir = gl.getUniformLocation(gl.program, 'u_CameraDir');
  if (!u_CameraDir) {
    console.log('Failed to get the storage location of u_CameraDir');
    return 1;
  }


  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return 1;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return 1;
  }

  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get the storage location of u_ProjMatrix');
    return 1;
  }

  a_VertexColor = gl.getAttribLocation(gl.program, 'a_VertexColor');
  if (a_VertexColor < 0) {
    console.log('Failed to get the storage location of a_VertexColor');
    return 1;
  }
  
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return 1;
  }

  u_selector = gl.getUniformLocation(gl.program, 'u_selector');
  if (u_selector < 0) {
    console.log('Failed to get the storage location of u_selector');
    return 1;
  }

  normalVisualization = gl.getUniformLocation(gl.program, "normalVisualization");
  if (normalVisualization < 0) {
    console.warn("normalVisualization could not be found");
    return 1;
  }
}

function setTextures () {
  let texture0 = gl.createTexture();

  let img = new Image();

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const uTex0 = gl.getUniformLocation(gl.program, "uTex0");
  if (uTex0 < 0) {
    console.warn("uTex0 could not be found");
    return 1;
  }

  img.onload = () => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  
    gl.uniform1i(uTex0, 0);
  };

  img.crossOrigin = "anonymous";
  img.src = "./block2.png";

  let texture1 = gl.createTexture();

  let img2 = new Image();

  const uTex1 = gl.getUniformLocation(gl.program, "uTex1");
  if (uTex1 < 0) {
    console.warn("uTex1 could not be found");
    return 1;
  }

  img2.onload = () => {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
  
    gl.uniform1i(uTex1, 1);
  };

  img2.crossOrigin = "anonymous";
  img2.src = "./block.png";
  return 0;
}

function clearCanvas (rgba=[0.8,0.8,1,1.0]) {
  // Specify values for clearing <canvas>
  gl.clearColor(rgba[0], rgba[1], rgba[2], rgba[3]);
  //gl.clearDepth(1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function addObjects (objects) {
  let lightObject = new Cube(gl, [1, 1, 0, 1]);
  lightObject.setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  objects.push(lightObject);

  let ground = new HeightMap(gl, heightmap);
  ground.setTranslate(-4, -2.5, -4);
  ground.setScale(4, 1, 4);
  objects.push(ground);

  //let skybox = new Cube(gl, [.5, .6, 1, 1]);
  //skybox.setScale(100, 100, 100);
  //objects.push(skybox);

  let sphere = new Sphere(gl, [.4, .5, .6, 1]);
  sphere.setTranslate(8, 1, 8);
  sphere.setScale(4, 4, 4);
  objects.push(sphere);

  for (let i = 0; i < walls.length; i++) {
    for (let j = 0; j < walls[i].length; j++) {
      for (let k = 0; k < walls[i][j]; k++) {
        let wall = new Cube(gl, null, k == walls[i][j] - 1 ? 1 : 0);
        wall.translate(i-4, k-2, j-4);
        objects.push(wall);
      }
    }
  }
}

function animateObjects (deltaTime) {
  for (let i = 0; i < objects.length; i++) {
    if ('animate' in objects[i]) {
      objects[i].animate(deltaTime);
    }
  }
}

let camMovement = [0, 0, 0, 0, 0, 0];
let camAngleChange = [0, 0];
let camAngle = [160, 0];
let camPos = [0, 0, 0];

function camUpdate () {
  viewMatrix.setTranslate(0, 0, 0);
  viewMatrix.setRotate(camAngle[1], 1, 0, 0);      
  viewMatrix.rotate(camAngle[0], 0, 1, 0);
  viewMatrix.translate(camPos[0], camPos[2], camPos[1]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  gl.uniform3f(u_CameraPos, camPos[0], camPos[2], camPos[1]);
  let angleChange = 135;
  gl.uniform3f(u_CameraDir, Math.cos((camAngle[1]) * Math.PI/180) * (Math.sin(-(camAngle[0]-angleChange) * Math.PI/180) + Math.cos((camAngle[0]-angleChange) * Math.PI/180)), Math.sin((camAngle[1]-angleChange) * Math.PI/180) - Math.cos((camAngle[1]-angleChange) * Math.PI/180), Math.cos((camAngle[1]) * Math.PI/180) * (Math.cos((camAngle[0]-angleChange) * Math.PI/180) + Math.sin((camAngle[0]-angleChange) * Math.PI/180)));
}

function physicsUpdate(time, deltaTime) {
  let camSpeed = 10;
  if (camMovement[0] != 0 || camMovement[1] != 0 || camMovement[2] != 0 || camMovement[3] != 0 || camMovement[4] != 0 || camMovement[5] != 0 || camAngleChange[0] != 0 || camAngleChange[1] != 0) {
    camPos[0] += ((camMovement[0] - camMovement[2]) * Math.sin(-camAngle[0] * Math.PI/180) + (camMovement[1] - camMovement[3]) * Math.cos(camAngle[0] * Math.PI/180)) * camSpeed * deltaTime;
    camPos[1] += ((camMovement[0] - camMovement[2]) * Math.cos(camAngle[0] * Math.PI/180) + (camMovement[1] - camMovement[3]) * Math.sin(camAngle[0] * Math.PI/180)) * camSpeed * deltaTime;
    camPos[2] += (camMovement[4] - camMovement[5]) * camSpeed * deltaTime;
    camAngle[0] -= camAngleChange[0] * deltaTime * 25;
    camAngle[0] += camAngleChange[1] * deltaTime * 25;
    camUpdate();
  }

  if (lightMove) {
    lightPos[0] = 5 + 10*Math.sin(time/1000);
    lightPos[2] = 10 + 10*Math.cos(time/1000);
    gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);
    objects[0].setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  }
}

function tick(newTime) {
  let deltaTime = (newTime - time) / 1000;//time in seconds
  time = newTime;
  frames++;
  if (newTime > lastFPSUpdate + 1000) {
    lastFPSUpdate = newTime;
    display.innerHTML = frames;
    frames = 0;
  }
  if (deltaTime > 0 && deltaTime < 0.2) { // discard frame if dt is too large (could be from switching to another tab)
    animateObjects(deltaTime);
    physicsUpdate(time, deltaTime);
  }
  clearCanvas();
  RenderObject.renderObjects(gl, objects, u_ModelMatrix, u_selector);
  requestAnimationFrame(tick);
}

function main() {
  if (setupWebGL() == 1 || connectVariablesToGLSL() == 1 || setTextures() == 1) {
    return 1;
  }
  clearCanvas();

  gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);

  projMatrix.setPerspective(60, gl.canvas.clientWidth / gl.canvas.clientHeight, .1, 10000);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  camUpdate();

  for (let i = 0; i < heightmap.length; i++) {
    for (let j = 0; j < heightmap[i].length; j++) {
      heightmap[i][j] += Math.random() / 2;
    }
  }
 
  addObjects(objects);

  let lClick = false;
  let rClick = false;
  canvas.addEventListener('mousedown', function(event) {
    if (event.button == 0) {
      lClick = true;
    } else if (event.button == 2) {
      let posX = Math.round(Math.min(32, Math.max(0, -camPos[1]+4-Math.cos(-camAngle[0] * Math.PI/180)*2)));
      let posY = Math.round(Math.min(32, Math.max(0, -camPos[0]+4-Math.sin(-camAngle[0] * Math.PI/180)*2)));
      if (event.shiftKey) {
        if (walls[posY][posX] > 0) walls[posY][posX]--;
        objects.length = 0;
        addObjects(objects);
      } else {
        walls[posY][posX]++;
        objects.length = 0;
        addObjects(objects);
      }
      rClick = true;
    }
  });
  canvas.addEventListener('mouseup', function(event) {
    if (event.button == 0) {
      lClick = false;
    } else if (event.button == 2) {
      rClick = false;
    }
  });
  canvas.addEventListener('mousemove', function(event) {
    if (lClick) {
      camAngle[0] += event.movementX;
      camAngle[1] = Math.min(Math.max(camAngle[1] + event.movementY, -90), 90);
      camUpdate();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.repeat) return;
    switch (event.key) {
      case 'w':
        camMovement[0] = 1;
        break;
      case 'a':
        camMovement[1] = 1;
        break;
      case 's':
        camMovement[2] = 1;
        break;
      case 'd':
        camMovement[3] = 1;
        break;
      case 'q':
        camAngleChange[0] = 1;
        break;
      case 'e':
        camAngleChange[1] = 1;
        break;
      case ' ':
        if (event.target == document.body) {
          event.preventDefault();
        }
        camMovement[5] = 1;
        break;
      case 'z':
        camMovement[4] = 1;
    }
  });
  document.addEventListener('keyup', function(event) {
    if (event.repeat) return;
    switch (event.key) {
      case 'w':
        camMovement[0] = 0;
        break;
      case 'a':
        camMovement[1] = 0;
        break;
      case 's':
        camMovement[2] = 0;
        break;
      case 'd':
        camMovement[3] = 0;
        break;
      case 'q':
        camAngleChange[0] = 0;
        break;
      case 'e':
        camAngleChange[1] = 0;
        break;
      case ' ':
        camMovement[5] = 0;
        break;
      case 'z':
        camMovement[4] = 0;
    }
  });
  let lightRGB = [1.0, 1.0, 1.0];
  gl.uniform3f(u_lightRGB, lightRGB[0], lightRGB[1], lightRGB[2]);
  document.getElementById('LightRed').oninput = function() {
    lightRGB[0] = document.getElementById('LightRed').value / 100.0;
    gl.uniform3f(u_lightRGB, lightRGB[0], lightRGB[1], lightRGB[2]);
  };
  document.getElementById('LightGreen').oninput = function() {
    lightRGB[1] = document.getElementById('LightGreen').value / 100.0;
    gl.uniform3f(u_lightRGB, lightRGB[0], lightRGB[1], lightRGB[2]);
  };
  document.getElementById('LightBlue').oninput = function() {
    lightRGB[2] = document.getElementById('LightBlue').value / 100.0;
    gl.uniform3f(u_lightRGB, lightRGB[0], lightRGB[1], lightRGB[2]);
  };
  let normalView = 0;
  let button = document.getElementById("NormalVis");
  button.onclick = function() {
    normalView = normalView == 0 ? 1 : 0;
    gl.uniform1i(normalVisualization, normalView);
  };

  let lighting = 1;
  gl.uniform1i(u_lighting, lighting);
  document.getElementById('LightingToggle').onclick = function () {
    lighting = lighting == 1 ? 0 : 1;
    gl.uniform1i(u_lighting, lighting);
  };

  let spotlight = 0;
  gl.uniform1i(u_spotlight, spotlight);
  document.getElementById('SpotlightToggle').onclick = function () {
    spotlight = spotlight == 1 ? 0 : 1;
    gl.uniform1i(u_spotlight, spotlight);
  };

  document.getElementById('LightMoveToggle').onclick = function () {
    lightMove = lightMove == 1 ? 0 : 1;
  };
  document.getElementById('LightX').oninput = function() {
    lightPos[0] = document.getElementById('LightX').value;
    gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);
    objects[0].setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  };
  document.getElementById('LightY').oninput = function() {
    lightPos[1] = document.getElementById('LightY').value;
    gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);
    objects[0].setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  };
  document.getElementById('LightZ').oninput = function() {
    lightPos[2] = document.getElementById('LightZ').value;
    gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);
    objects[0].setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  };

  lastFPSUpdate = 0;
  frames = 0;
  display = document.getElementById('display');
  time = 0;
  tick(time);
}
