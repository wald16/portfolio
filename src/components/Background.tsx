'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Custom shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                mouse: { value: new THREE.Vector2(0.5, 0.5) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                uniform vec2 mouse;
                varying vec2 vUv;

                // Noise functions
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));

                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }

                void main() {
                    vec2 uv = vUv;
                    
                    // Create a dynamic gradient based on mouse position
                    vec2 center = mouse;
                    float dist = length(uv - center);
                    
                    // Create multiple layers of noise
                    float n1 = noise(uv * 3.0 + time * 0.1);
                    float n2 = noise(uv * 6.0 - time * 0.15);
                    float n3 = noise(uv * 12.0 + time * 0.2);
                    
                    // Combine noise layers
                    float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
                    
                    // Create a pulsing effect
                    float pulse = sin(time * 0.5) * 0.5 + 0.5;
                    
                    // Create base colors
                    vec3 color1 = vec3(0.5, 0.0, 0.5); // Purple
                    vec3 color2 = vec3(0.0, 0.4, 1.0); // Blue
                    
                    // Mix colors based on noise and distance
                    vec3 color = mix(color1, color2, noise + dist * 0.5);
                    
                    // Add some sparkle
                    float sparkle = pow(noise, 3.0) * pulse;
                    color += vec3(sparkle);
                    
                    // Apply mouse interaction
                    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, dist);
                    color += vec3(mouseInfluence * 0.2);
                    
                    // Add subtle movement
                    color += vec3(sin(time * 0.5 + uv.x * 10.0) * 0.05);
                    
                    gl_FragColor = vec4(color, 0.15);
                }
            `,
            transparent: true,
        });
        materialRef.current = material;

        // Create geometry and mesh
        const geometry = new THREE.PlaneGeometry(2, 2);
        geometryRef.current = geometry;
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {
            if (materialRef.current) {
                materialRef.current.uniforms.mouse.value.x = event.clientX / window.innerWidth;
                materialRef.current.uniforms.mouse.value.y = 1.0 - (event.clientY / window.innerHeight);
            }
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            if (materialRef.current) {
                materialRef.current.uniforms.time.value += 0.01;
            }

            if (meshRef.current) {
                meshRef.current.rotation.z += 0.001;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current || !materialRef.current) return;

            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
            materialRef.current.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (containerRef.current && rendererRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            geometryRef.current?.dispose();
            materialRef.current?.dispose();
            rendererRef.current?.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10"
            style={{ background: 'black' }}
        />
    );
};

export default Background; 