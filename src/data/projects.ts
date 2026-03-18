export interface Project {
    id: string;
    title: string;
    description: string;
    descriptionEs: string;
    image: string;
    tags: string[];
    link?: string;
    githubLink: string;
}

export const projects: Project[] = [
    {
        id: 'project-1',
        title: 'Manage Your Money',
        description: 'A web application for managing personal finances — track expenses, set budgets, and visualize spending habits.',
        descriptionEs: 'Aplicación web para gestionar finanzas personales — registrá gastos, establecé presupuestos y visualizá tus hábitos de consumo.',
        image: '/projects/panel.png',
        tags: ['JavaScript', 'PostgreSQL', 'HTML', 'CSS'],
        link: 'https://manage-your-money-dusky.vercel.app/',
        githubLink: 'https://github.com/wald16/ManageYourMoney',
    },
    {
        id: 'project-2',
        title: 'Dog Game',
        description: 'A fun browser game to train Mora, a mischievous little dog, through interactive mini-games.',
        descriptionEs: 'Un juego de navegador para entrenar a Mora, una perrita traviesa, a través de minijuegos interactivos.',
        image: '/projects/mora.png',
        tags: ['JavaScript', 'HTML', 'CSS'],
        githubLink: 'https://github.com/wald16/dog-game',
    },
    {
        id: 'project-3',
        title: 'Audio Visualizer',
        description: 'An interactive music player with real-time audio visualization — built with Next.js and the Web Audio API.',
        descriptionEs: 'Reproductor de música interactivo con visualización de audio en tiempo real — construido con Next.js y la Web Audio API.',
        image: '/projects/music.png',
        tags: ['TypeScript', 'Next.js', 'Tailwind CSS', 'Web Audio API'],
        link: 'https://audio-visualizer-flame.vercel.app/',
        githubLink: 'https://github.com/wald16/AudioVisualizer',
    },
    {
        id: 'project-4',
        title: 'Homelab Infrastructure',
        description: 'A self-hosted home server running on Ubuntu Linux — containerized services with Docker, reverse proxy with Nginx, secure remote access via WireGuard, and a custom resource monitoring dashboard.',
        descriptionEs: 'Servidor casero self-hosted corriendo en Ubuntu Linux — servicios containerizados con Docker, reverse proxy con Nginx, acceso remoto seguro via WireGuard y un panel de monitoreo de recursos propio.',
        image: '/projects/dashy.png',
        tags: ['Linux', 'Docker', 'Nginx', 'WireGuard', 'Bash'],
        githubLink: 'https://github.com/wald16/homelab-infra',
    },
];
