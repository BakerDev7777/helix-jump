const THREE = {
  Vector3: class { constructor(public x=0, public y=0, public z=0) {} },
  Group: class { add() {} rotation = { y: 0 }; position = { y: 0 } },
  Mesh: class { position = { x: 0, y: 0, z: 0 }; visible = true },
  MeshLambertMaterial: class { color = 0; dispose() {} },
  SphereGeometry: class { dispose() {} },
  ExtrudeGeometry: class { rotateX() { return this }; dispose() {} },
  Shape: class { absarc() { return this }; holes: any[] = []; closePath() {} },
  Path: class { absarc() { return this } },
  AmbientLight: class {},
  DirectionalLight: class { position = { set() {} } },
  PerspectiveCamera: class { position = { set() {}, x: 0, y: 0, z: 0 }; lookAt() {}; updateProjectionMatrix() {}; aspect = 1 },
  Scene: class { add() {}; background = null },
  WebGLRenderer: class { setSize() {}; setPixelRatio() {}; render() {}; dispose() {}; setClearColor() {}; domElement = { style: {} } },
  Color: class { constructor(public hex = 0) {} },
  PointLight: class { position = { set() {} } },
  Material: class { dispose() {} },
}

export default THREE
export const {
  Vector3, Group, Mesh, MeshLambertMaterial, SphereGeometry,
  ExtrudeGeometry, Shape, Path, AmbientLight, DirectionalLight,
  PerspectiveCamera, Scene, WebGLRenderer, Color, PointLight, Material,
} = THREE as any
