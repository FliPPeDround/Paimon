import './modules/three.min.js'
import './modules/faceapi.min.js'
import './modules/FBXLoader.js'
import './modules/fflate.min.js'
import { ambientLight } from './ults/light.js'

const video = document.getElementById('video')

video.width = document.body.clientWidth
video.height = document.body.clientHeight

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./assets/module')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    {video: true},
    stream => video.srcObject = stream,
    error => console.error(error)
  )
}

let faceWordVector = new THREE.Vector2(0, 0)
let old_faceX
let old_faceY

async function getFaceWordVector () {
  const detections = await faceapi
  .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({inputSize: 128, scoreThreshold: 0.3}))

  if(detections.length){
    const faceRightX = (detections[0].relativeBox.x + detections[0].relativeBox.width * 1.2) * document.body.clientWidth
    const faceRightY = (detections[0].relativeBox.y + detections[0].relativeBox.height / 2) * document.body.clientHeight

    const x = (faceRightX / window.innerWidth) * 2 - 1
    const y = -(faceRightY / window.innerHeight) * 2 + 1

    const worldVector = new THREE.Vector3(x, y, 0.5).unproject(camera)
    if (Math.abs(old_faceX - worldVector.x) > 20 || Math.abs(old_faceY - worldVector.y) > 15) {
      faceWordVector = new THREE.Vector2(worldVector.x, worldVector.y)
    }
  }
}

const scene = new THREE.Scene()
const texture = new THREE.VideoTexture( video )
scene.background = texture

const group = new THREE.Group();

const loader = new THREE.FBXLoader();
loader.load('assets/fbx/paimeng.fbx', (obj) => {
  obj.scale.set(2.5, 2.5, 2.5);
  group.add(obj)
  scene.add(group)
})


// var axisHelper = new THREE.AxisHelper(250);
// scene.add(axisHelper);

scene.add( ambientLight )

const width = document.body.clientWidth
const height = document.body.clientHeight

const camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000)

camera.position.set(0, 0, 30)
camera.lookAt(group.position)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
renderer.setClearColor(0xb9d3ff, 1)
document.body.appendChild(renderer.domElement)


function render () {
  requestAnimationFrame(getFaceWordVector)
  group.position.x = old_faceX = faceWordVector?.x
  group.position.y = old_faceY = faceWordVector?.y
  requestAnimationFrame(render)
  renderer.render(scene,camera)
}
render();