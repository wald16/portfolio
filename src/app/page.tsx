'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data/projects';

// Dynamically import the background component to avoid SSR issues
const Background = dynamic(() => import('@/components/Background'), { ssr: false });

export default function Home() {
    return (
        <main className="relative">
            <Navigation />
            <Background />

            {/* Home Section */}
            <section id="home" className="section flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center z-10"
                >
                    <motion.h1
                        className="text-6xl md:text-8xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        MANUEL WALD
                    </motion.h1>
                    <motion.p
                        className="text-xl md:text-2xl text-purple-400"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Creative Developer & Designer
                    </motion.p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                        <motion.div
                            className="w-1 h-3 bg-white/50 rounded-full mt-2"
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* About Section */}
            <section id="about" className="section flex items-center justify-center bg-black/50">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">About Me</h2>
                        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                            I'm a creative developer passionate about building immersive digital experiences.
                            With expertise in modern web technologies and a keen eye for design,
                            I create unique and engaging solutions that push the boundaries of what's possible on the web.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Projects Section */}
            <section id="projects" className="section py-20 bg-black/50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-center mb-16"
                    >
                        Featured Projects
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} {...project} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="section flex items-center justify-center bg-black/50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">Let's Build Something</h2>
                        <p className="text-lg md:text-xl text-gray-300 mb-12">
                            Have a project in mind? I'd love to hear about it.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-purple-600 text-white rounded-full text-lg font-medium hover:bg-purple-700 transition-colors"
                        >
                            Get in Touch
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </main>
    );
} 