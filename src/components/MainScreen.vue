<template>
    <div class="canvas-holder">
        <canvas
            ref="canvas"
            class="canvas-full"
            tabindex="1"
            @keydown="onKeyDown"
            @mousemove="onMouseMove"
            @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave">
        </canvas>
        <FPSCounter
            v-show="showFps"
            ref="fps"
        >
        </FPSCounter>
        <div class="control-panel">
            <button @click="setSceneMode('normal')" :class="isButtonSelectedClass('normal')">NORMAL</button>
            <button @click="setSceneMode('status')" :class="isButtonSelectedClass('status')">STATUS</button>
            <button @click="setSceneMode('provider')" :class="isButtonSelectedClass('provider')">PROVIDER</button>
            <button @click="setSceneMode('version')" :class="isButtonSelectedClass('version')">VERSION</button>
            <button @click="setSceneMode('bond')" :class="isButtonSelectedClass('bond')">BOND</button>
        </div>
    </div>
</template>

<script>

import "@/css/common.css"
import * as THREE from "three"
import {Config} from "@/config";
import CameraControls from "camera-controls";
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass";
import FPSCounter from "@/components/parts/FPSCounter";
import {MainScene} from "@/visual/MainScene";
import TWEEN from "tween";
import {Background} from "@/visual/helpers/Background";
import {emitter, EventTypes} from "@/helpers/EventTypes";
// import {TrailTestScene} from "@/visual/TrailTestScene";

export default {
    name: 'MainScreen',
    components: {FPSCounter},
    props: {},

    data() {
        return {
            showFps: Config.Debug.ShowFPS,

            nodes: [],
            prevNodes: [],

            mouseEnterX: 0,
            mouseEnterY: 0,

            sceneMode: 'normal',

            fullyLoaded: false,
        }
    },

    methods: {
        onKeyDown(event) {
            if (event.code === 'KeyR') {
                this.resetCamera()
            } else if (event.code === 'KeyF') {
                this.showFps = !this.showFps
            } else if (event.code === 'KeyH') {
                console.log('help?')
            }
        },

        onMouseMove(event) {
            const x = event.clientX
            const y = event.clientY
            if (!this.mouseEnterX) {
                this.mouseEnterX = x
                this.mouseEnterY = y
                return
            }
            const scale = Config.Controls.Camera.MouseMoveStrength
            const dx = this.mouseEnterX - x
            const dy = this.mouseEnterY - y
            this.mouseEnterX = x
            this.mouseEnterY = y
            this.controls.rotate(dx * scale, dy * scale)
        },

        onMouseEnter(event) {
            this.mouseEnterX = event.clientX
            this.mouseEnterY = event.clientY
        },

        onMouseLeave() {
        },

        resetCamera() {
            this.controls.reset()
        },

        resizeRendererToDisplaySize() {
            const renderer = this.renderer
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            const needResize = this.composer._width !== width || this.composer._height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
                if (this.bloomPass) {
                    this.bloomPass.setSize(width, height);
                }
                this.composer.setSize(width, height);
                if(this.bg) {
                    this.bg.setSize(width, height)
                }
            }

            return needResize;
        },

        render() {
            this.resizeRendererToDisplaySize(this.renderer)

            let delta = this.clock.getDelta();

            if(delta > 0.5) {
                delta = 0.5
            }

            this.$refs.fps.update(delta, this.scene)
            this.controls.update(delta);
            this.content.update(delta)

            this.bg.update(delta);

            TWEEN.update()

            this.composer.render(delta)

            requestAnimationFrame(this.render);
        },

        createCamera() {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight,
                0.001, Config.Controls.Camera.Distance.Max * 2);
            // this.camera = new THREE.OrthographicCamera()
            this.camera.position.z = Config.Controls.Camera.Distance.Start
        },

        createCameraControl() {
            const controls = this.controls = new CameraControls(this.camera, this.renderer.domElement);
            const cfg = Config.Controls.Camera

            controls.dragToOffset = true
            controls.minDistance = cfg.Distance.Min
            controls.maxDistance = cfg.Distance.Max
            this.camera.position.z = cfg.Distance.Start

            controls.minAzimuthAngle = THREE.MathUtils.degToRad(-cfg.AzimuthAngleLimit)
            controls.maxAzimuthAngle = THREE.MathUtils.degToRad(cfg.AzimuthAngleLimit)

            controls.minPolarAngle = THREE.MathUtils.degToRad(-cfg.PolarAngleLimit + 90)
            controls.maxPolarAngle = THREE.MathUtils.degToRad(cfg.PolarAngleLimit + 90)

            controls.update(0)
        },

        makeSkybox() {
            // this.bg = new Background(this.scene)
            // this.bg = new BlackgroundStaticBox(this.scene, Config.Scene.Sky.SkyBox, Config.Scene.Sky.SkyBoxExt)
            this.bg = new Background(this.scene)
            this.bg.install()
        },

        makeRenderer(canvas) {
            let renderer = this.renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: false,
                logarithmicDepthBuffer: false,
            });

            if (devicePixelRatio) {
                console.log(`Renderer: Setting devicePixelRatio = ${devicePixelRatio}.`)
                renderer.setPixelRatio(devicePixelRatio)
            }

            const renderScene = new RenderPass(this.scene, this.camera);

            this.composer = new EffectComposer(renderer);
            this.composer.addPass(renderScene);

            const bloomCfg = Config.Effects.Bloom
            if (bloomCfg.Enabled) {
                this.bloomPass = new UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    bloomCfg.Strength,
                    bloomCfg.Radius,
                    bloomCfg.Threshold)
                this.composer.addPass(this.bloomPass);
            }
        },

        buildScene() {
            this.scene.add(this.camera)
            this.makeSkybox()

            this.content = new MainScene(this.scene, this)
            // this.content = new TrailTestScene(this.scene, this)
        },

        setSceneMode(mode) {
            this.sceneMode = mode
            if (this.content.nodeGroup) {
                this.content.nodeGroup.mode = mode
            }
        },

        isButtonSelectedClass(modeName) {
            return {
                'button-selected': this.sceneMode === modeName
            }
        },

        pokeActivity() {
            this.$refs.fps.pokeActivity()
        },

        onFullyLoaded() {
            console.log('fully loaded! removing loading screen...')
        }
    },

    mounted() {
        this.canvas = this.$refs.canvas

        this.clock = new THREE.Clock()
        this.scene = new THREE.Scene()

        this.createCamera(this.canvas)
        this.makeRenderer(this.canvas)
        this.createCameraControl()
        this.resizeRendererToDisplaySize()
        this.buildScene()

        requestAnimationFrame(this.render);
        emitter.on(EventTypes.FullyLoaded, this.onFullyLoaded)
    },

    unmounted() {
        this.content.dispose()
        this.controls.dispose()
        emitter.off(EventTypes.FullyLoaded)
    }
}

</script>

<style>

.canvas-full {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
}

canvas {
    width: 100vw; height: 100vh;
    display: block;
}

.canvas-holder {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
}

.control-panel {
    position: absolute;
    bottom: 4px;
    right: 4px;
}

.button-selected {
    border-width: 2px;
    opacity: 1.0;
}

</style>
