'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProjectCardProps {
    title: string;
    description: string;
    image: string;
    tags: string[];
    link?: string;
    githubLink: string;
}

const ProjectCard = ({ title, description, image, tags, link, githubLink }: ProjectCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="group relative bg-black/50 rounded-lg overflow-hidden hover:bg-black/60 transition-colors duration-300"
        >
            {/* Image Container */}
            <div className="relative h-64 w-96 overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-90"
                />
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-300 mb-4">{description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 text-sm bg-purple-600/20 text-purple-400 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Links */}
                <div className="flex gap-4">
                    {link && (
                        <motion.a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-none inline-flex items-center px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-800/80 transition-colors"
                            whileHover={{ x: 5 }}
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                            Live Site
                        </motion.a>
                    )}

                    <motion.a
                        href={githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-none inline-flex items-center px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-800/80 transition-colors"
                        whileHover={{ x: 5 }}
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                            />
                        </svg>
                        GitHub
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard; 