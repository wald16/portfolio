"use client";
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Lenis from "@studio-freight/lenis";

const FullPageBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, particleSystem;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);
      }

      const particleCount = 3000;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 15;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      }

      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.07,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });

      particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);
      camera.position.z = 5;
      animate();
    };

    const animate = () => {
      particleSystem.rotation.y += 0.0005;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    init();
    return () => renderer.dispose();
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-auto" />;
};

const MagneticText = ({ children }) => (
  <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
    {children}
  </motion.div>
);
const projects = [
  { title: "Proyecto 1", description: "Descripción del proyecto 1", image: "https://via.placeholder.com/400" },
  { title: "Proyecto 2", description: "Descripción del proyecto 2", image: "https://via.placeholder.com/400" },
  { title: "Proyecto 3", description: "Descripción del proyecto 3", image: "https://via.placeholder.com/400" }
];

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis();
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, []);

  return (
    <div className="font-sans text-white relative overflow-hidden bg-black">
      <Head>
        <title>Mi Portfolio - Manuel Wald</title>
        <meta name="description" content="Portfolio de desarrollo web con efectos visuales y animaciones." />
      </Head>
      <FullPageBackground />
      <nav className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 flex space-x-6 text-lg font-light">
        <MagneticText><a href="#about">Sobre mí</a></MagneticText>
        <MagneticText><a href="#projects">Proyectos</a></MagneticText>
        <MagneticText><a href="#contact">Contacto</a></MagneticText>
      </nav>
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-7xl font-extrabold text-white drop-shadow-md"
        >
          Bienvenido a mi Portfolio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="mt-4 text-xl font-light"
        >
          Explorando nuevas formas de hacer la web más interactiva y divertida.
        </motion.p>
      </section>
      <section id="about" className="py-20 text-center">
        <h2 className="text-5xl font-bold">Sobre mí</h2>
        <p className="text-lg mt-4 max-w-3xl mx-auto">
          Soy Manuel Wald Katz, estudiante de Ciencias de la Computación en la Universidad de Buenos Aires. Tengo experiencia en desarrollo web, enseñanza y producción audiovisual.
        </p>
      </section>
      <section id="projects" className="py-20 text-center">
        <h2 className="text-5xl font-bold">Proyectos</h2>
        <div className="mt-10 flex flex-col items-center relative space-y-10">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="relative flex flex-col items-center text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <img src={project.image} alt={project.title} className="w-80 h-auto rounded-lg shadow-lg" />
              <h3 className="text-2xl font-bold mt-4">{project.title}</h3>
              <p className="text-lg mt-2 max-w-md text-center">{project.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section id="contact" className="py-20 text-center">
        <h2 className="text-5xl font-bold">Contacto</h2>
        <p className="text-lg mt-4">Email: <a href="mailto:manuwald16@gmail.com" className="text-blue-400">manuwald16@gmail.com</a></p>
      </section>
    </div>
  );
}
