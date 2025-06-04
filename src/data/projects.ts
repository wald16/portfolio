export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    link: string;
}

export const projects: Project[] = [
    {
        id: 'project-1',
        title: 'Immersive Web Experience',
        description: 'A creative web application featuring interactive 3D elements and smooth animations.',
        image: '/placeholders/project1.svg',
        tags: ['Three.js', 'React', 'WebGL'],
        link: 'https://example.com/project1',
    },
    {
        id: 'project-2',
        title: 'E-commerce Platform',
        description: 'A modern e-commerce solution with real-time inventory and payment processing.',
        image: '/placeholders/project2.svg',
        tags: ['Next.js', 'Node.js', 'MongoDB'],
        link: 'https://example.com/project2',
    },
    {
        id: 'project-3',
        title: 'Creative Portfolio',
        description: 'A unique portfolio website showcasing creative work with interactive elements.',
        image: '/placeholders/project3.svg',
        tags: ['React', 'Framer Motion', 'GSAP'],
        link: 'https://example.com/project3',
    },
    // Add more projects as needed
]; 