export type NodeKey = "self" | "work" | "free" | "home";

export interface TopologyNode {
    x: string;
    y: string;
    id: string;
    sub: string;
    state: string;
    title: string;
    body: string;
    meta: [string, string][];
}

export const NODES: Record<NodeKey, TopologyNode> = {
    self: {
        x: "50%",
        y: "50%",
        id: "sysadmin",
        sub: "nodo central",
        state: "ready",
        title: "DevOps Engineer, y también construyo producto.",
        body: "Opero infraestructura crítica en el sector público, mantengo un homelab con VPN y túneles propios, y desarrollo frontend freelance en React/Next.js. Último año de Tecnicatura en Programación (UTN FRBA).",
        meta: [
            ["role", "DevOps Engineer · Frontend"],
            ["edu", "UTN FRBA · Tec. en Programación (último año)"],
            ["edges", "prod, freelance, homelab"],
        ],
    },
    work: {
        x: "18%",
        y: "20%",
        id: "dgsisan",
        sub: "ministerio de salud · infra crítica",
        state: "operational",
        title: "Infraestructura crítica en el Ministerio de Salud (GCBA).",
        body: "DGSISAN — Dirección General de Sistemas de Información en Salud. Operación de 179 servicios y 177 servidores con 8,70M de requests diarias en SIGEHOS, dando soporte a ~90 efectores de salud de CABA. CI/CD sobre GitLab CI + kaniko + Ansible (Harbor), observabilidad full-stack y troubleshooting root-cause en Linux productivo.",
        meta: [
            ["sector", "salud pública · CABA"],
            ["scope", "179 servicios · 177 servidores · 8,70M req/día"],
            ["tools", "GitLab CI, kaniko, Ansible, k3s, Oracle, F5"],
        ],
    },
    free: {
        x: "84%",
        y: "24%",
        id: "freelance",
        sub: "producto · frontend",
        state: "accepting",
        title: "Producto y frontend para clientes.",
        body: "Sitios y aplicaciones en React y Next.js con TypeScript: desde el diseño de la interfaz hasta el deploy, accesibilidad incluida.",
        meta: [
            ["stack", "React · Next.js · TypeScript"],
            ["delivery", "diseño → build → deploy"],
            ["featured", "Brava"],
        ],
    },
    home: {
        x: "60%",
        y: "86%",
        id: "homelab",
        sub: "infra propia · self-hosted",
        state: "running",
        title: "Infraestructura propia, 24/7.",
        body: "Servicios self-hosted en Docker Compose detrás de Nginx, acceso remoto por WireGuard y exposición selectiva con Cloudflare Tunnels. El lugar donde se rompen las cosas antes de romperse en producción.",
        meta: [
            ["net", "WireGuard (10.13.13.0/24) · Cloudflare Tunnels"],
            ["proxy", "Nginx"],
            ["runtime", "Docker Compose"],
        ],
    },
};

export const NODE_ORDER: NodeKey[] = ["self", "work", "free", "home"];

export interface StackItem {
    name: string;
    image: string;
    health: string;
    up: string;
    note: string;
}

export interface StackGroup {
    group: string;
    items: StackItem[];
}

export const STACK: StackGroup[] = [
    {
        group: "ci-cd",
        items: [
            { name: "gitlab-ci", image: "gitlab/gitlab-runner", health: "healthy", up: "5mo", note: "" },
            { name: "jenkins", image: "jenkins/jenkins:lts", health: "healthy", up: "5mo", note: "apps históricas Django/Glassfish · el agente se quedó sin disco una vez, df -h está en el runbook desde entonces" },
            { name: "kaniko", image: "gcr.io/kaniko-project/executor", health: "healthy", up: "5mo", note: "build de imágenes sin daemon docker · publica a Harbor" },
            { name: "harbor", image: "goharbor/harbor-core", health: "healthy", up: "5mo", note: "registry interno para las imágenes de los 4 ambientes" },
        ],
    },
    {
        group: "orchestration",
        items: [
            { name: "docker", image: "docker:27-dind", health: "healthy", up: "3y", note: "" },
            { name: "kubernetes", image: "rancher/k3s", health: "healthy", up: "5mo", note: "CrashLoopBackOff a las 3am · era un ConfigMap con un espacio de más" },
            { name: "helm", image: "alpine/helm", health: "healthy", up: "5mo", note: "" },
        ],
    },
    {
        group: "iac-config",
        items: [
            { name: "ansible", image: "ansible/ansible-runner", health: "healthy", up: "5mo", note: "un --check olvidado reinició un servicio en prod · ahora hay un alias que lo agrega siempre" },
        ],
    },
    {
        group: "observability",
        items: [
            { name: "prometheus", image: "prom/prometheus", health: "healthy", up: "5mo", note: "métricas de los 4 ambientes · RIS, Kafka y microservicios críticos" },
            { name: "grafana", image: "grafana/grafana", health: "healthy", up: "5mo", note: "" },
            { name: "loki", image: "grafana/loki", health: "healthy", up: "5mo", note: "vía Promtail" },
            { name: "dynatrace", image: "dynatrace/oneagent", health: "healthy", up: "5mo", note: "" },
            { name: "icinga", image: "icinga/icinga2", health: "healthy", up: "5mo", note: "falsos positivos en cluster k3s · ajustado el threshold" },
            { name: "sentry", image: "getsentry/sentry", health: "healthy", up: "5mo", note: "" },
        ],
    },
    {
        group: "infra-db",
        items: [
            { name: "oracle-db", image: "oracle/database:19c", health: "healthy", up: "5mo", note: "ORA-01555 snapshot too old · con una vez alcanza" },
            { name: "mysql", image: "mysql:8", health: "healthy", up: "5mo", note: "" },
            { name: "f5-bigip", image: "f5/ltm", health: "healthy", up: "5mo", note: "routing erróneo en prod · resuelto sin downtime" },
        ],
    },
    {
        group: "networking-selfhosted",
        items: [
            { name: "docker-compose", image: "docker/compose", health: "healthy", up: "3y", note: "" },
            { name: "wireguard", image: "linuxserver/wireguard", health: "healthy", up: "2y", note: "handshake perdido por cambio de IP del ISP · ver incident report de homelab" },
            { name: "cloudflared", image: "cloudflare/cloudflared", health: "healthy", up: "2y", note: "" },
            { name: "nginx", image: "nginx:alpine", health: "healthy", up: "3y", note: "exit 137 en 2024-06 · OOM por un access.log sin logrotate · rota cada 7d desde entonces" },
        ],
    },
    {
        group: "frontend",
        items: [
            { name: "react", image: "node:20-alpine", health: "healthy", up: "3y", note: "" },
            { name: "nextjs", image: "vercel/next", health: "healthy", up: "2y", note: "" },
        ],
    },
];

export interface Project {
    key: string;
    featured: boolean;
    name: string;
    tagline: string;
    uptime: string;
    deploy: string;
    tags: string[];
    built: string;
    broke: string;
    fixed: string;
    stack: string;
    href: string;
    linkLabel: string;
}

export const PROJECTS: Project[] = [
    {
        key: "homelab",
        featured: true,
        name: "Homelab Infrastructure",
        tagline: "self-hosted · 24/7",
        uptime: "99.92%",
        deploy: "hace 3 días",
        tags: ["Docker", "Nginx", "WireGuard"],
        built: "Stack self-hosted en Docker Compose: reverse proxy Nginx con TLS, WireGuard para acceso remoto y Cloudflare Tunnels para exponer solo lo necesario sin abrir puertos al router.",
        broke: "Un cambio de IP del ISP dejó la VPN sin handshake y el proxy respondiendo 502 en todos los servicios internos.",
        fixed: "DDNS + healthcheck que reinicia el peer de WireGuard, y separación del tráfico público (Tunnels) del privado (VPN). Cero puertos expuestos desde entonces.",
        stack: "Docker Compose · Nginx · WireGuard · Cloudflare Tunnels",
        href: "https://github.com/wald16/homelab-infra",
        linkLabel: "ver repo",
    },
    {
        key: "brava",
        featured: true,
        name: "Brava",
        tagline: "sitio para agencia",
        uptime: "100%",
        deploy: "hace 2 semanas",
        tags: ["Next.js", "TypeScript"],
        built: "Sitio institucional para una agencia: Next.js con TypeScript, contenido tipado, imágenes optimizadas y deploy continuo desde main.",
        broke: 'Lighthouse marcaba CLS alto por fuentes y hero sin dimensiones reservadas; el cliente lo veía como "salta al cargar".',
        fixed: "Preload de fuentes con fallback métrico, dimensiones explícitas en todo media y componentes de imagen con placeholder. CLS < 0.05.",
        stack: "Next.js · TypeScript · Vercel",
        href: "https://agenciabrava.com.ar",
        linkLabel: "ver sitio",
    },
    {
        key: "dalto",
        featured: false,
        name: "Simulador de Daltonismo",
        tagline: "accesibilidad web",
        uptime: "99.9%",
        deploy: "hace 4 meses",
        tags: ["React", "a11y"],
        built: "Herramienta para previsualizar interfaces bajo distintos tipos de daltonismo usando matrices de color aplicadas en tiempo real.",
        broke: "Las matrices de simulación usadas al inicio no coincidían con la literatura; los resultados exageraban la protanopia.",
        fixed: "Recalibración contra matrices publicadas (Machado et al.) y tests visuales con paletas de referencia.",
        stack: "React · Canvas · CSS filters",
        href: "https://daltonismo.wald16.fun",
        linkLabel: "ver demo",
    },
    {
        key: "audio",
        featured: false,
        name: "Audio Visualizer",
        tagline: "Web Audio API",
        uptime: "99.8%",
        deploy: "hace 6 meses",
        tags: ["Web Audio", "Canvas"],
        built: "Visualizador de espectro en tiempo real desde micrófono o archivo, con análisis FFT y render en canvas a 60fps.",
        broke: "Drops de frames en dispositivos móviles al escalar el canvas con devicePixelRatio alto.",
        fixed: "Limitar el DPR efectivo a 2 y reducir el tamaño del FFT en pantallas chicas.",
        stack: "Web Audio API · Canvas · Vite",
        href: "https://audio-visualizer-flame.vercel.app/",
        linkLabel: "ver demo",
    },
    {
        key: "money",
        featured: false,
        name: "Manage Your Money",
        tagline: "finanzas personales",
        uptime: "99.7%",
        deploy: "hace 8 meses",
        tags: ["PostgreSQL", "Next.js"],
        built: "App de finanzas personales con categorías, presupuestos y reportes mensuales sobre PostgreSQL.",
        broke: "Consultas de reportes lentas al crecer la tabla de movimientos (full scan por mes).",
        fixed: "Índice compuesto (usuario, fecha) y vistas materializadas para los agregados mensuales.",
        stack: "Next.js · PostgreSQL · Prisma",
        href: "https://manage-your-money-dusky.vercel.app/",
        linkLabel: "ver repo",
    },
];

export interface Port {
    port: string;
    service: string;
    version: string;
    href: string;
}

export const PORTS: Port[] = [
    { port: "25/tcp", service: "smtp", version: "manuwald16@gmail.com", href: "mailto:manuwald16@gmail.com" },
    { port: "22/tcp", service: "ssh", version: "github.com/wald16", href: "https://github.com/wald16" },
    { port: "443/tcp", service: "https", version: "linkedin.com/in/manuel-wald", href: "https://www.linkedin.com/in/manuel-wald-504093276/" },
];

export const NMAP_CMD = "nmap -sV wald16.fun";

export const MOTD = [
    "Welcome to ar-bue-1 · Debian GNU/Linux 12 (bookworm) · 6.1.0-25-amd64",
    "System load: 0.18   Processes: 212   Users logged in: 1",
    "0 updates can be applied immediately. 1 sysadmin can.",
];

export const SECTIONS: Record<string, string> = {
    topology: "topology",
    services: "stack",
    projects: "projects",
    contact: "contact",
};

export const ALIASES: Record<string, string> = {
    topo: "topology",
    stack: "services",
    status: "projects",
    endpoints: "contact",
    ports: "contact",
};

export const FILES: Record<string, string> = {
    homelab: "homelab.md",
    brava: "brava.md",
    dalto: "daltonismo.md",
    audio: "audio-visualizer.md",
    money: "manage-your-money.md",
};

export const COMMANDS = [
    "help",
    "ls",
    "cd",
    "cat",
    "man",
    "pwd",
    "history",
    "clear",
    "exit",
    "whoami",
    "motd",
    "uptime",
    "docker ps",
    "ping",
    "sl",
    "sudo",
    "neofetch",
    "git log --oneline",
    "top",
    "ps aux",
];

export const START_DATE = new Date("2023-03-01T00:00:00Z");

export const DOCKER_CMD =
    'docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}" --filter status=running';
