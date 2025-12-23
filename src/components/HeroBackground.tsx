import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- Shaders ---

const cloudVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const cloudFragmentShader = `
uniform float uTime;
varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  // Moving noise
  float noise1 = snoise(vUv * 3.0 + uTime * 0.1);
  float noise2 = snoise(vUv * 6.0 - uTime * 0.15);
  
  // Combine noise for cloud density
  float density = (noise1 + noise2 * 0.5) * 0.5 + 0.5;
  
  // Deep red storm colors
  vec3 color1 = vec3(0.1, 0.0, 0.0); // Dark red/black
  vec3 color2 = vec3(0.8, 0.1, 0.1); // Bright red
  
  // Mix colors based on density
  vec3 finalColor = mix(color1, color2, density * density);
  
  // Vignette effect in shader
  float dist = distance(vUv, vec2(0.5));
  finalColor *= smoothstep(0.8, 0.2, dist);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const monsterFragmentShader = `
uniform float uTime;
varying vec2 vUv;

// Reusing noise function (simplified for brevity in this context, usually would import)
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Spider/Mind-Flayer shape using polar coordinates and noise
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  
  // Noise based on angle and time to create "tentacles"
  float n = snoise(vec2(a * 2.0, uTime * 0.5));
  float n2 = snoise(vec2(a * 5.0, uTime * 0.8));
  
  // Shape definition
  float shape = 0.3 + 0.1 * n + 0.05 * n2;
  
  // Soft edge
  float alpha = 1.0 - smoothstep(shape, shape + 0.2, r);
  
  // Eyes?
  // float eyeL = 1.0 - smoothstep(0.02, 0.03, distance(uv, vec2(-0.1, 0.05)));
  // float eyeR = 1.0 - smoothstep(0.02, 0.03, distance(uv, vec2(0.1, 0.05)));
  
  // Dark silhouette color
  vec3 color = vec3(0.05, 0.0, 0.0);
  
  gl_FragColor = vec4(color, alpha * 0.9); // Semi-transparent smoke
}
`;

// --- Components ---

const Sky = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    if (mesh.current) {
      uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -10]} scale={[30, 20, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

const Monster = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    if (mesh.current) {
      uniforms.uTime.value = state.clock.getElapsedTime();
      // Subtle breathing movement
      mesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2 + 1;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 1, -5]} scale={[8, 8, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={cloudVertexShader} // Reuse vertex shader
        fragmentShader={monsterFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

const CityLights = () => {
  const count = 200;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!mesh.current) return;

    for (let i = 0; i < count; i++) {
      // Distribute along the horizon
      const x = (Math.random() - 0.5) * 30;
      const y = -2 + Math.random() * 0.5; // Near bottom
      const z = -5 - Math.random() * 5;
      
      dummy.position.set(x, y, z);
      const scale = Math.random() * 0.05 + 0.01;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      
      // Random colors: yellow, orange, white
      const color = new THREE.Color();
      if (Math.random() > 0.7) color.setHex(0xffaa00); // Orange
      else if (Math.random() > 0.5) color.setHex(0xffff00); // Yellow
      else color.setHex(0xffffff); // White
      
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [dummy]);

  useFrame((state) => {
    if (!mesh.current) return;
    // Simple flicker effect by scaling random instances? 
    // Too expensive to update all matrices every frame.
    // Instead, we'll just let them be static distant lights for performance.
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="white" toneMapped={false} />
    </instancedMesh>
  );
};



export const HeroBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-black">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={['#050000']} />
        <fogExp2 attach="fog" args={['#1a0505', 0.15]} />
        
        <Sky />
        <Monster />
        <CityLights />
        
        {/* Ambient Particles */}
        <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.5} color="#ff0000" />
        
        {/* Post-processing simulation via overlay */}
        <mesh position={[0, 0, 4.5]}>
            <planeGeometry args={[20, 10]} />
            <meshBasicMaterial 
                color="#220000" 
                transparent 
                opacity={0.1} 
                blending={THREE.MultiplyBlending}
                premultipliedAlpha={true}
            />
        </mesh>
      </Canvas>
      
      {/* CSS Vignette Overlay for performance and style */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{
             background: 'radial-gradient(circle, transparent 50%, black 100%)',
             opacity: 0.8
           }} 
      />
      {/* CSS Scanlines/Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
           }}
      />
    </div>
  );
};
