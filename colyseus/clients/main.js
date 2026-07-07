import * as THREE from "three";
import { Client, Callbacks } from "@colyseus/sdk";
 
const client = new Client("http://localhost:2567");

const room_connect = await client.joinOrCreate("gameroom");
console.log(room_connect.roomId);
console.log(room_connect.state);

const callbacks = Callbacks.get(room_connect);

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

const playerMeshes = new Map();

callbacks.onAdd("players", (playerState, sessionId) => {
    console.log("Player joined:", sessionId);
    console.log(playerState.x, playerState.y, playerState.z);

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            1,    // width
            3,    // height
            1     // depth
        ),
        new THREE.MeshStandardMaterial({
            color:0x00ff88
        })
    );

    mesh.position.set(
        playerState.x,
        playerState.y,
        playerState.z
    );

    //console.log(mesh.position);
    scene.add(mesh);

    playerMeshes.set(sessionId, mesh);

    callbacks.listen(playerState, "x", (x) => {
        mesh.position.x = x;
    });

    callbacks.listen(playerState, "y", (y) => {
        mesh.position.y = y;
    });

    callbacks.listen(playerState, "z", (z) => {
        mesh.position.z = z;
    });

    callbacks.listen(playerState, "yaw", (yaw) => {
        mesh.rotation.y = yaw;
    });
})


callbacks.onRemove("players", (playerState, sessionId)=>{
    console.log("Player left:", sessionId);
    
    const mesh = playerMeshes.get(sessionId);

    if (!mesh) return;

    scene.remove(mesh);

    mesh.geometry.dispose();

    if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
    } else {
        mesh.material.dispose();
    }

    playerMeshes.delete(sessionId);
})

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

let yaw = 0;
let pitch = 0;

const MOUSE_SENSITIVITY = 0.002;

renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {

    if (document.pointerLockElement !== renderer.domElement)
        return;

    yaw -= e.movementX * MOUSE_SENSITIVITY;

    pitch -= e.movementY * MOUSE_SENSITIVITY;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 3,
        Math.PI / 3
    );

});

const SPEED = 0.15;
const CAMERA_SMOOTHNESS = 0.08;

// ---------------------------
// Update Player
// ---------------------------

function updatePlayer() {

    const me = playerMeshes.get(room_connect.sessionId);

    if (!me) return;

    // Rotate player
    me.rotation.y = yaw;

    // Forward vector relative to player's rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    // Right vector relative to player's rotation
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    if (keys["w"])
        me.position.addScaledVector(forward, SPEED);

    if (keys["s"])
        me.position.addScaledVector(forward, -SPEED);

    if (keys["a"])
        me.position.addScaledVector(right, -SPEED);

    if (keys["d"])
        me.position.addScaledVector(right, SPEED);

    if (keys[" "])
        me.position.y += SPEED;

    if (keys["shift"])
        me.position.y -= SPEED;

    const half = ROOM_SIZE / 2;

    me.position.x = THREE.MathUtils.clamp(
        me.position.x,
        -half + 0.5,
        half - 0.5
    );

    me.position.y = THREE.MathUtils.clamp(
        me.position.y,
        -half + 1.5,
        half - 1.5
    );

    me.position.z = THREE.MathUtils.clamp(
        me.position.z,
        -half + 0.5,
        half - 0.5
    );

    room_connect.send("move", {
        x: me.position.x,
        y: me.position.y,
        z: me.position.z,
        yaw: yaw
    });

}

// ---------------------------
// Update Camera
// ---------------------------

function updateCamera() {

    const me = playerMeshes.get(room_connect.sessionId);

    if (!me) return;

    // Camera offset behind the player
    const offset = new THREE.Vector3(
        0,
        3,
        7
    );

    // Rotate offset around player
    offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    const desiredPosition = me.position
        .clone()
        .add(offset);

    camera.position.lerp(
        desiredPosition,
        CAMERA_SMOOTHNESS
    );

    const target = me.position.clone();
    target.y += 1.5;

    camera.lookAt(target);

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