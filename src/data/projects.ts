export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    link?: string;
    githubLink: string;
}

export const projects: Project[] = [
    {
        id: 'project-1',
        title: 'Manage Your Money',
        description: 'A web application for managing personal finances',
        image: '/projects/panel.png',
        tags: ['JavaScript', 'PostgreSQL', 'HTML', 'CSS'],
        link: 'https://manage-your-money-dusky.vercel.app/',
        githubLink: 'https://github.com/wald16/ManageYourMoney',
    },
    {
        id: 'project-2',
        title: 'Dog Game',
        description: 'A cute and fun game to train Mora, a mischievous little dog, through interactive mini-games.',
        image: '/projects/mora.png',
        tags: ['JavaScript', 'HTML', 'CSS'],
        githubLink: 'https://github.com/wald16/dog-game',
    },
    {
        id: 'project-3',
        title: 'Creative Portfolio',
        description: 'A modern web application that provides an interactive and visually appealing interface for listening to downloaded music.',
        image: '/projects/music.png',
        tags: ['TypeScript', 'JavaScript', 'Tailwind CSS', 'Next.js'],
        link: 'https://audio-visualizer-flame.vercel.app/',
        githubLink: 'https://github.com/wald16/AudioVisualizer',
    },
    // Add more projects as needed
]; 
