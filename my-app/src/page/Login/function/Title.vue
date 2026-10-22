<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement>()

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let group: THREE.Group | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
const clock = new THREE.Clock()

function makeTextMesh(
  text: string,
  opts: { fill: string; outline?: string; outlineWidth?: number; height: number; opacity?: number },
): THREE.Mesh {
  const fontSize = 96
  const font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif`

  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')!
  measureCtx.font = font
  const textWidth = measureCtx.measureText(text).width

  const canvas = document.createElement('canvas')
  const padding = opts.outlineWidth ? opts.outlineWidth * 4 + 24 : 24
  canvas.width = Math.ceil(textWidth + padding)
  canvas.height = Math.ceil(fontSize * 1.4)
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (opts.outline && opts.outlineWidth) {
    ctx.lineWidth = opts.outlineWidth
    ctx.strokeStyle = opts.outline
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
  }
  ctx.fillStyle = opts.fill
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const aspect = canvas.width / canvas.height
  const geometry = new THREE.PlaneGeometry(opts.height * aspect, opts.height)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: opts.opacity ?? 1,
    depthWrite: false,
  })
  return new THREE.Mesh(geometry, material)
}

function animate() {
  rafId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()
  if (group) {
    group.position.y = Math.sin(t * 1.8) * 0.25
    group.rotation.y = Math.sin(t * 1.8) * 0.12
    group.rotation.x = Math.sin(t * 0.9) * 0.06
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth || 620
  const height = container.clientHeight || 120

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 100)
  camera.position.set(0, 0, 9)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
  scene.add(ambientLight)
  const light1 = new THREE.DirectionalLight(0x9ad7ff, 2.2)
  light1.position.set(3, 4, 5)
  scene.add(light1)
  const light2 = new THREE.DirectionalLight(0xff7e9b, 1.6)
  light2.position.set(-4, -2, 3)
  scene.add(light2)

  group = new THREE.Group()

  const title = makeTextMesh('智链采', { fill: '#60a5fa', outline: '#dbeafe', outlineWidth: 6, height: 1.1 })
  title.position.set(-2.25, 0, 0.2)
  group.add(title)

  const zlink = makeTextMesh('Z-LINK', { fill: '#fb7185', outline: '#ffe4e6', outlineWidth: 6, height: 1.15 })
  zlink.position.set(2.1, 0, -0.3)
  group.add(zlink)

  const ghost = makeTextMesh('Z-LINK', { fill: '#fda4af', height: 1.15, opacity: 0.22 })
  ghost.position.set(2.1, 0, -0.9)
  group.add(ghost)

  scene.add(group)

  resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth || 620
    const h = container.clientHeight || 120
    if (camera) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    renderer?.setSize(w, h)
  })
  resizeObserver.observe(container)

  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  resizeObserver = null

  group?.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry?.dispose()
      const material = mesh.material as THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
      const materials = Array.isArray(material) ? material : [material]
      materials.forEach((m) => {
        m.map?.dispose()
        m.dispose()
      })
    }
  })

  scene?.clear()
  if (renderer) {
    renderer.dispose()
    renderer.domElement.parentNode?.removeChild(renderer.domElement)
  }
  renderer = null
  scene = null
  camera = null
  group = null
})
</script>

<template>
  <div
    ref="containerRef"
    style="width: 100%; max-width: 620px; height: 120px; background: transparent; overflow: hidden;"
  ></div>
</template>