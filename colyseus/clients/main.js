import * as THREE from "three";
import { Client, Callbacks } from "@colyseus/sdk";
 
const client = new Client("http://localhost:2567");
 
// Join or create a room
const room_connect = await client.joinOrCreate("gameroom");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------------------------
// Lighting
// ---------------------------

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 10, 5);
scene.add(sun);

// ---------------------------
// Room
// ---------------------------

const ROOM_SIZE = 20;

const room = new THREE.Mesh(
    new THREE.BoxGeometry(
        ROOM_SIZE,
        ROOM_SIZE,
        ROOM_SIZE
    ),
    new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        side: THREE.BackSide
    })
);

scene.add(room);

// Grid Floor

const grid = new THREE.GridHelper(
    ROOM_SIZE,
    20,
    0xffffff,
    0x666666
);

grid.position.y = -ROOM_SIZE / 2 + 0.01;

scene.add(grid);

// ---------------------------
// Player
// ---------------------------

const player = new THREE.Mesh(
    new THREE.CapsuleGeometry(
        0.5,
        1.5,
        8,
        16
    ),
    new THREE.MeshStandardMaterial({
        color: 0x00ff88
    })
);

scene.add(player);

// Lift player onto floor

player.position.y = -ROOM_SIZE / 2 + 1.25;

// ---------------------------
// Camera
// ---------------------------

camera.position.set(0, 4, 8);

// ---------------------------
// Controls
// ---------------------------

const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

const SPEED = 0.15;
const CAMERA_SMOOTHNESS = 0.08;

// ---------------------------
// Update Player
// ---------------------------

function updatePlayer() {

    const direction = new THREE.Vector3();

    if (keys["w"]) direction.z -= 1;
    if (keys["s"]) direction.z += 1;
    if (keys["a"]) direction.x -= 1;
    if (keys["d"]) direction.x += 1;

    direction.normalize();

    player.position.addScaledVector(direction, SPEED);

    if (keys[" "]) {
        player.position.y += SPEED;
    }

    if (keys["shift"]) {
        player.position.y -= SPEED;
    }

    const half = ROOM_SIZE / 2;

    player.position.x = THREE.MathUtils.clamp(
        player.position.x,
        -half + 0.5,
        half - 0.5
    );

    player.position.y = THREE.MathUtils.clamp(
        player.position.y,
        -half + 1.25,
        half - 0.5
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z,
        -half + 0.5,
        half - 0.5
    );


}

// ---------------------------
// Update Camera
// ---------------------------

function updateCamera() {

    const desiredPosition = new THREE.Vector3(
        player.position.x,
        player.position.y + 3,
        player.position.z + 7
    );

    camera.position.lerp(
        desiredPosition,
        CAMERA_SMOOTHNESS
    );

    camera.lookAt(player.position);
}

// ---------------------------
// Resize
// ---------------------------

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

// ---------------------------
// Animation
// ---------------------------

function animate() {

    requestAnimationFrame(animate);

    updatePlayer();

    updateCamera();

    renderer.render(scene, camera);

}

animate();