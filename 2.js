import * as THREE from 'three'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Vector2 } from 'three';



// Scene setup
var scene = new THREE.Scene();

//loaders
const loader1 = new OBJLoader()
const loader2 = new OBJLoader()

// Camera setup
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 9;
camera.position.y = 1;
camera.lookAt( 0, 0, 0 );

// Renderer setup
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//control
const controls = new OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.addEventListener( 'change', renderer );

// Lights
scene.add( new THREE.AmbientLight( 0x888888 ) );

// Sphere geometry
var geometrysphere = new THREE.SphereGeometry( 3, 200, 200 );

const particleMaterial = new THREE.ShaderMaterial({
    extensions:{ derivatives:"extension GL_OES_standard_derivatives : enable"},
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
        time: {type:"f",value:0},
        resolution: {type:"v4", value: new THREE.Vector4()},
        uvRate1: {
            value: new THREE.Vector2(1,1)
        }
    },
    vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec2 vUv1;
        varying vec4 vPosition;
    
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform vec2 pixels;
        uniform vec2 uvRate1;
    
        void main(){
            vUv = uv;
            vec3 p = position;
            p.y += 0.1*(sin(p.y*10.0 + time)*1.0 +0.5);
            p.z += 0.1*(sin(p.y*10.0 + time)*5.0 +0.5);

            vec4 mvPosition = modelViewMatrix * vec4( p, 1.0);
            gl_PointSize = 10.0 * (1.0 / - mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }`,
    fragmentShader: `
        uniform float time;
        uniform float progress;
        uniform sampler2D texture1;
    
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
        }`
})


//particles
let N = 6000;
let positions = new Float32Array( N * 3);
var particleGeometry = new THREE.BufferGeometry();

let inc = Math.PI*(3 - Math.sqrt(5));
let off = 2/N;
let rad = 3;

for (let i=0; i<N; i++){
    let y = i*off -1 + (off/2);
    let r = Math.sqrt(1-y*y);
    let phi = i*inc;
    positions[3*i] = rad*Math.cos(phi)*r;
    positions[3*i+1] = rad*y;
    positions[3*i+2] = rad*Math.sin(phi)*r;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute( positions, 3));
var points = new THREE.Points(particleGeometry, particleMaterial)
points.position.x = 0;
points.position.y = 0;
points.position.z = 0;
points.scale.y = 1.5;
const count = geometrysphere.attributes.position.count;

scene.add( points );




const shaderMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;
        uniform float uFrequency;
        uniform float uAmplitude;
        uniform float uTime;

        attribute vec3 position;
        attribute vec3 normal;

        varying vec3 vUv; 
        varying vec3 vNormal;


        void main(){
            vUv = position; 
            vNormal = normal;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            modelPosition.y += sin(modelPosition.z * uFrequency - uTime) * uAmplitude + 1.5;
            modelPosition.x += cos(modelPosition.z * uFrequency + uTime) * uAmplitude/10.0+0.2;
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
    `,
    fragmentShader: `
        precision mediump float;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float positionVec;

        varying vec3 vUv;
        varying vec3 vNormal;

        void main(){
            vec3 light = vec3(0.0);
            vec3 lightDirection = normalize(vec3(0.0,1.0,1.0));
            light += dot(lightDirection,vNormal);
            light = mix(uColor1, uColor2, dot(lightDirection,vNormal));
            float alpha = smoothstep(-5.2, 2.0, vUv.y);
            float colorMix = smoothstep(0.0, 2.0, vUv.y);
            gl_FragColor = vec4(light, 1.0);
            // gl_FragColor = vec4(mix(uColor1, uColor2, colorMix), 1.0);
            
        }`,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uFrequency: { value: 0.8},
        uAmplitude: { value: 0.05},
        uTime: {value:0.0},
        uColor1:{value: new THREE.Color('#00E1FD')},
        uColor2:{value: new THREE.Color(0.9, 0.5,0.2)},
        positionVec:{value:-8.0},
    }
})

loader1.load('./asset/model1_neuro.obj', function (object) {
    // Add the object to the scene
    scene.add(object);
    // Apply a material to the object
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = shaderMaterial;
      }
    });
  });


const shaderMaterial2 = new THREE.RawShaderMaterial({
    vertexShader: `
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;
        uniform vec2 uFrequency;
        uniform vec2 uAmplitude;
        uniform float uTime;

        attribute vec3 position;
        attribute vec3 normal;

        varying vec3 vUv; 
        varying vec3 vNormal;


        void main(){
            vUv = position; 
            vNormal = normal;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            modelPosition.y += sin(modelPosition.x * uFrequency.x - uTime) * uAmplitude.x+1.5;
            modelPosition.x += cos(modelPosition.y * uFrequency.y + uTime) * uAmplitude.y+0.1;
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
    `,
    fragmentShader: `
        precision mediump float;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float positionVec;

        varying vec3 vUv;
        varying vec3 vNormal;

        void main(){
            vec3 light = vec3(0.0);
            vec3 lightDirection = normalize(vec3(0.0,1.0,1.0));
            light += dot(lightDirection,vNormal);
            light = mix(uColor1, uColor2, dot(lightDirection,vNormal));
            float alpha = smoothstep(-5.2, 2.0, vUv.y);
            float colorMix = smoothstep(0.0, 2.0, vUv.y);
            gl_FragColor = vec4(light, 0.8);
            // gl_FragColor = vec4(mix(uColor1, uColor2, colorMix), alpha);
            
        }`,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uFrequency: { value: new THREE.Vector2(20,10)},
        uAmplitude: { value: new THREE.Vector2(0.02,0.01)},
        uTime: {value:0.0},
        uColor1:{value: new THREE.Color('#00E1FD')},
        uColor2:{value: new THREE.Color('#FC007A')},
        positionVec:{value:-8.0},
    }
})

  loader2.load('./asset/model1_other.obj', function (object) {

    // Add the object to the scene
    scene.add(object);
    // Apply a material to the object
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = shaderMaterial2;
      }
    });
  });

  const shaderMaterial3 = new THREE.RawShaderMaterial({
    vertexShader: `
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;
        uniform vec2 uFrequency;
        uniform vec2 uAmplitude;
        uniform float uTime;

        attribute vec3 position;
        attribute vec3 normal;

        varying vec3 vUv; 
        varying vec3 vNormal;


        void main(){
            vUv = position; 
            vNormal = normal;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            modelPosition.y += sin(modelPosition.x * uFrequency.x - uTime) * uAmplitude.x ;
            modelPosition.x += cos(modelPosition.y * uFrequency.y + uTime) * uAmplitude.y ;
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
    `,
    fragmentShader: `
        precision mediump float;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float positionVec;

        varying vec3 vUv;
        varying vec3 vNormal;

        void main(){
            vec3 light = vec3(0.0);
            vec3 lightDirection = normalize(vec3(0.0,1.0,1.0));
            light += dot(lightDirection,vNormal);
            light = mix(uColor1, uColor2, dot(lightDirection,vNormal));
            float alpha = smoothstep(-5.2, 2.0, vUv.y);
            float colorMix = smoothstep(0.0, 2.0, vUv.y);
            gl_FragColor = vec4(light, 1.0);
            // gl_FragColor = vec4(uColor1, 0.3);
            
        }`,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uFrequency: { value: new THREE.Vector2(10,200)},
        uAmplitude: { value: new THREE.Vector2(0.01,0.01)},
        uTime: {value:0.0},
        uColor1:{value: new THREE.Color('#FC007A')},
        uColor2:{value: new THREE.Color('#D05746')},
        positionVec:{value:-8.0},
    }
})

var heart;
var heartsize;
const sphere = new THREE.SphereGeometry (0.1, 20, 20);
for (let i =0; i<20; i ++) {
    const object = new THREE.Mesh (sphere, shaderMaterial3);
    object.position.x = Math.random() * 4 -2;
    object.position.y = Math.random() * 6 -3;
    object.position.z = Math.random() * 6 -3;
    scene.add(object);
}

function remap(x, inMin, inMax, outMin, outMax) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}


let targetHeartrate = 60;
let heartrate = 80;
const clock = new THREE.Clock()
let time = 0;
// Animate the wave movement by updating the `time` uniform value in the shader
const animate = function() {
    updateHeart();
    document.querySelector('#data-log').textContent = targetHeartrate;
    document.querySelector('#date').textContent = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date);
    time = clock.getElapsedTime();
    var cyclepersecond = heartrate/60;
    var heartbeat = Math.sin(Math.PI *2 *cyclepersecond *time);
    // sphere.rotation.y = sphere.rotation.z = time * 0.01;
    // console.log(time, heartbeat)
    // heartsize = remap(heartrate,60,80,1,2);
    // heart.scale.set(heartsize, heartsize, heartsize);
    particleMaterial.uniforms.time.value = time*2;
    shaderMaterial.uniforms.uTime.value = time;
    shaderMaterial2.uniforms.uTime.value = time;
    shaderMaterial3.uniforms.uTime.value = time;
    shaderMaterial3.uniforms.uFrequency.value = new THREE.Vector2(10,remap(heartrate,60,80,20,200));
    shaderMaterial.uniforms.uColor2.value = new THREE.Color(0.9,0.5,remap(heartrate,60,80,0.0,1.0));
    shaderMaterial2.uniforms.uColor2.value = new THREE.Color(0.9,0.5,remap(heartrate,60,80,0.0,1.0));
    shaderMaterial3.uniforms.uColor2.value = new THREE.Color(0.9,0.5,remap(heartrate,60,80,0.0,1.0));
    points.rotation.y = time/100;
    sphere.scale.set = (1.0, 0.2, 0.2);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};
  
animate();



// const loop = () => {
//     updateHeart()
//     const elapsedTime = clock.getElapsedTime()
//     shaderMaterial.uniforms.uTime.value = elapsedTime
//     renderer.render(scene, camera)
//     window.requestAnimationFrame(loop)
// }
// loop()




const ws = new WebSocket('wss://app.hyperate.io/socket/websocket?token=kRlMNLczO9QuVaTyrSx2PnKMwtxplks8wjdqPjPTFVICVAFdUsziOy04s3319OnC');

ws.onopen = () => {
    ws.send(JSON.stringify({
      "topic": "hr:internal-testing",
      "event": "phx_join",
      "payload": {},
      "ref": 0
    }));
    sendHeartbeat();
};

ws.onmessage = (data)=>{
//   console.log(data);
    var object = JSON.parse(data.data.toString());
  // console.log(object);
  console.log(object.payload.hr);
  if (object.payload.hr){
    targetHeartrate = object.payload.hr;
    
  }
};

function sendHeartbeat() {
  console.log('sendHeartbeat');
  ws.send(JSON.stringify({topic: 'phoenix', event: 'heartbeat', payload: {}, ref: 0}));
  setTimeout(sendHeartbeat, 29 * 1000);
}

// Listen for possible errors
ws.addEventListener('error', (event) => {
  console.log('WebSocket error: ', event);
});

function updateHeart(){
    heartrate = heartrate * .99 + targetHeartrate * .01
    const size = heartrate/60
    // sphere.scale.set(size,size,size)
    
}





// const material = new THREE.RawShaderMaterial({
//     vertexShader:`
//         uniform float amplitude;

//         attribute float displacement;
    
//         varying vec3 vNormal;
//         varying vec2 vUv;
    
    
    
//         void main() {
    
//             vNormal = normal;
//             vUv = ( 0.5 + amplitude ) * uv + vec2( amplitude );
    
//             vec3 newPosition = position + amplitude * normal * vec3( displacement );
//             gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
//         }
//     `,
//     fragmentShader:`
//         varying vec3 vNormal;
//         varying vec2 vUv;
    
//         uniform vec3 color;
//         uniform sampler2D colorTexture;
    
//         void main() {
    
//             vec3 light = vec3( 0.5, 0.2, 1.0 );
//             light = normalize( light );
    
//             float dProd = dot( vNormal, light ) * 0.5 + 0.5;
    
//             vec4 tcolor = texture2D( colorTexture, vUv );
//             vec4 gray = vec4( vec3( tcolor.r * 0.3 + tcolor.g * 0.59 + tcolor.b * 0.11 ), 1.0 );
    
//             gl_FragColor = gray * vec4( vec3( dProd ) * vec3( color ), 1.0 );
    
//         }
//     `,
//     extensions: { derivatives:"extension GL_OES_standard_derivatives : enable"},
//     side: THREE.DoubleSide,
//     uniforms: {
//         amplitude: {value: 1.0 },
//         texture: {type:"t", value: new THREE.TextureLoader().load(heart)},
//         resolution: {type:"v4", value: new THREE.Vector4()},
//         uvRate1: {value: new THREE.Vector2(1,1)}
//     }
// })

// const shaderMaterial3 = new THREE.RawShaderMaterial({
//     vertexShader: `
//         uniform float amplitude;
//         uniform mat4 projectionMatrix;
//         uniform mat4 modelViewMatrix;

//         attribute float displacement;
//         attribute vec3 normal;
//         attribute vec3 position;

//         varying vec3 vNormal;
//         varying vec2 vUv;

//         void main() {

//             vNormal = normal;
//             vUv = ( 0.5 + amplitude ) * vUv + vec2( amplitude );

//             vec3 newPosition = position + amplitude * normal * vec3( displacement );
//             gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

//         }
//     `,
//     fragmentShader: `
//     precision mediump float;

//         varying vec3 vNormal;
//         varying vec2 vUv;

//         uniform vec3 color;
//         uniform sampler2D colorTexture;

//         void main() {

//             vec3 light = vec3( 0.5, 0.2, 1.0 );
//             light = normalize( light );

//             float dProd = dot( vNormal, light ) * 0.5 + 0.5;

//             vec4 tcolor = texture2D( colorTexture, vUv );
//             vec4 gray = vec4( vec3( tcolor.r * 0.3 + tcolor.g * 0.59 + tcolor.b * 0.11 ), 1.0 );

//             gl_FragColor = gray * vec4( vec3( dProd ) * vec3( color ), 1.0 );

//         }
//         `,
//     transparent: true,
//     side: THREE.DoubleSide,
//     uniforms: {
//         amplitude: { value: 1.0},
//         color: { value: new THREE.Color( 0xff2200 )},
//         colorTexture: { value: new THREE.TextureLoader().load( 'textures/water.jpeg' ) }

//     }
// })

// let displacement, noise;
// const geometry = new THREE.SphereGeometry( 0.3, 128, 128 );

// displacement = new Float32Array( geometry.attributes.position.count );
// noise = new Float32Array( geometry.attributes.position.count );

// for ( let i = 0; i < displacement.length; i ++ ) {

// 	noise[ i ] = Math.random() * 5;

// }

// geometry.setAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );

// const sphere = new THREE.Mesh( geometry, shaderMaterial3 );
// scene.add( sphere );
// sphere.position.x = -1.5;
// sphere.position.y = 0.5;
// sphere.position.z = -0.5;



// sphere.scale.y = 1.5;
// const sphereGeometry = new THREE.SphereGeometry(0.1, 10, 10);
// const pointsMaterial = new THREE.MeshBasicMaterial({
//     color: 0xffffff,
// });

// const particleCount = 6;
// for (let i = 0; i < particleCount; i++) {
//   // Create a particle
//   const particle = new THREE.Mesh(sphereGeometry, shaderMaterial);

//   // Randomly position the particle within the sphere
//   const position = new THREE.Vector3(
//     Math.random() * 400 - 200,
//     Math.random() * 400 - 200,
//     Math.random() * 400 - 200
//   ).normalize();
//   position.multiplyScalar(Math.random());
//   particle.position.copy(position);

//   // Randomly scale the particle
//   const scale = Math.random() + 1;
//   particle.scale.set(scale, scale, scale);

  // Add the particle to the scene
//   scene.add(particle);
// }



// let time = 0;
// // Animate the wave movement by updating the `time` uniform value in the shader
// const animate = function() {
//     time += 0.05;
//     // sphere.rotation.y = sphere.rotation.z = time * 0.01;

//     particleMaterial.uniforms.time.value = time;
//     shaderMaterial.uniforms.uTime.value = time;
//     shaderMaterial2.uniforms.uTime.value = time;
//     shaderMaterial3.uniforms.uTime.value = time;
//     points.rotation.y = time/100;
//     // shaderMaterial3.uniforms.amplitude.value = 0.01;
//     // shaderMaterial3.uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
//     // for ( let i = 0; i < displacement.length; i ++ ) {

//     //     displacement[ i ] = Math.sin( 0.1 * i + time );

//     //     noise[ i ] += 0.5 * ( 0.5 - Math.random() );
//     //     noise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 5, 5 );

//     //     displacement[ i ] += noise[ i ];

//     // }

//     // sphere.geometry.attributes.displacement.needsUpdate = true;

// // geometrysphere.attributes.position.needsUpdate = true;

//     renderer.render(scene, camera);
//     requestAnimationFrame(animate);
// };
  
// animate();