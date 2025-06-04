export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    link: string;
    githubLink: string;
}

export const projects: Project[] = [
    {
        id: 'project-1',
        title: 'Manage Your Money',
        description: 'A creative web application featuring interactive 3D elements and smooth animations.',
        image: '/projects/panel.png',
        tags: ['JavaScript', 'HTML', 'CSS'],
        link: 'https://manage-your-money-dusky.vercel.app/',
        githubLink: 'https://github.com/wald16/ManageYourMoney',
    },
    {
        id: 'project-2',
        title: 'E-commerce Platform',
        description: 'A modern e-commerce solution with real-time inventory and payment processing.',
        image: '/placeholders/project2.svg',
        tags: ['Next.js', 'Node.js', 'MongoDB'],
        link: 'https://example.com/project2',
        githubLink: 'https://github.com/wald16/ManageYourMoney',
    },
    {
        id: 'project-3',
        title: 'Creative Portfolio',
        description: 'A unique portfolio website showcasing creative work with interactive elements.',
        image: '/placeholders/project3.svg',
        tags: ['React', 'Framer Motion', 'GSAP'],
        link: 'https://example.com/project3',
        githubLink: 'https://github.com/wald16/ManageYourMoney',
    },
    // Add more projects as needed
]; 