"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
    ALIASES,
    COMMANDS,
    DOCKER_CMD,
    FILES,
    MOTD,
    NMAP_CMD,
    NODES,
    NODE_ORDER,
    NodeKey,
    PORTS,
    PROJECTS,
    SECTIONS,
    STACK,
    START_DATE,
} from "@/data/portfolio";

const GREEN = "#a6e3a1";
const GREEN_DIM = "rgba(166,227,161,.08)";
const MAUVE = "#cba6f7";
const BORDER = "#313244";
const BG = "#1e1e2e";

interface Line {
    s: string;
    c?: string;
    u?: string;
    d?: string;
}

interface TermState {
    phase: "idle" | "typing" | "running" | "done";
    cmd: string;
    out: number;
    input: string;
    hist: Line[];
    date: string;
}

function daysSinceStart() {
    return Math.floor((Date.now() - START_DATE.getTime()) / 864e5);
}

function uptimeString() {
    const days = daysSinceStart();
    return `${Math.floor(days / 365)}y ${days % 365}d`;
}

function lastLogin() {
    const d = new Date(Date.now() - 864e5);
    return d.toDateString().slice(0, 10) + " 23:41:07 " + d.getFullYear();
}

function resolveSection(tok: string): string | null {
    let t = (tok || "").replace(/^~\/?|^\//, "").replace(/\/$/, "").toLowerCase();
    t = ALIASES[t] || t;
    return SECTIONS[t] ? t : null;
}

function findProj(tok: string) {
    const t = (tok || "").replace(/^.*\//, "").replace(/\.md$/, "").toLowerCase();
    if (!t) return null;
    return (
        PROJECTS.find(
            (p) =>
                p.key === t ||
                FILES[p.key].replace(".md", "") === t ||
                p.name.toLowerCase().replace(/\s+/g, "-").startsWith(t)
        ) || null
    );
}

function scrollToSection(label: string) {
    const el = document.querySelector(`[data-screen-label="${label}"]`);
    if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 40;
        window.scrollTo({ top, behavior: "instant" });
    }
}

function complete(input: string): { input?: string; list?: string } | null {
    const parts = input.split(/\s+/);
    const last = parts[parts.length - 1];
    const cmd = parts[0];
    const secs = Object.keys(SECTIONS).map((s) => s + "/");
    const files = [...Object.values(FILES), "TODO.md"];
    const cands =
        parts.length === 1
            ? COMMANDS
            : cmd === "cd" || cmd === "ls"
            ? secs
            : cmd === "cat" || cmd === "man"
            ? [...files, ...secs]
            : [];
    const pre = last.startsWith("~/") ? "~/" : "";
    const bare = last.slice(pre.length);
    const m = cands.filter((x) => x.startsWith(bare));
    if (!m.length) return null;
    let common = m[0];
    m.forEach((x) => {
        while (!x.startsWith(common)) common = common.slice(0, -1);
    });
    if (m.length === 1 || common.length > bare.length) {
        parts[parts.length - 1] = pre + common;
        return { input: parts.join(" ") + (m.length === 1 && !common.endsWith("/") ? " " : "") };
    }
    return { list: m.join("  ") };
}

const containerCount = STACK.reduce((n, g) => n + g.items.length, 0);

export default function Portfolio() {
    const [clock, setClock] = useState("");
    const [uptime, setUptime] = useState("");
    const [buildStamp, setBuildStamp] = useState("");
    const [lastLoginStr, setLastLoginStr] = useState("");
    const [year, setYear] = useState(2026);
    const [hovered, setHovered] = useState<NodeKey | null>(null);
    const [selected, setSelected] = useState<NodeKey>("self");
    const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({ homelab: true, brava: true });
    const [typed, setTyped] = useState<Record<string, number>>({});
    const [jitter, setJitter] = useState(false);
    const [dotTip, setDotTip] = useState(false);
    const [boot, setBoot] = useState(0);
    const [bootLog, setBootLog] = useState<string[]>([]);
    const [term, setTerm] = useState<TermState>({ phase: "idle", cmd: "", out: 0, input: "", hist: [], date: "" });
    const [panel, setPanel] = useState(false);
    const [pLines, setPLines] = useState<Line[]>([]);
    const [pInput, setPInput] = useState("");
    const [cwd, setCwd] = useState("~");
    const [cmdHist, setCmdHist] = useState<string[]>([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [hintBlink, setHintBlink] = useState(false);

    const topoRef = useRef<HTMLDivElement>(null);
    const nmapRef = useRef<HTMLDivElement>(null);
    const nmapInputRef = useRef<HTMLInputElement>(null);
    const panelInputRef = useRef<HTMLInputElement>(null);
    const panelBodyRef = useRef<HTMLDivElement>(null);
    const typersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const bootedRef = useRef(false);
    const armedRef = useRef(false);
    const everOpenedRef = useRef(false);
    const savedScrollRef = useRef<number | null>(null);

    // clock tick
    useEffect(() => {
        const tick = () => {
            setClock(
                new Intl.DateTimeFormat("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "America/Argentina/Buenos_Aires",
                }).format(new Date())
            );
            setUptime(uptimeString());
        };
        tick();
        setBuildStamp(new Date().toISOString().slice(0, 19) + "Z");
        setLastLoginStr(lastLogin());
        setYear(new Date().getFullYear());
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, []);

    // status dot jitter
    useEffect(() => {
        let cancelled = false;
        const schedule = () => {
            const wait = 7000 + Math.random() * 9000;
            const t = setTimeout(() => {
                if (cancelled) return;
                setJitter(true);
                setTimeout(() => {
                    if (cancelled) return;
                    setJitter(false);
                    schedule();
                }, 70);
            }, wait);
            return t;
        };
        const t = schedule();
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, []);

    const boot4 = useCallback(() => {
        const names = ["sysadmin", "dgsisan", "freelance", "homelab"];
        const t0 = performance.now();
        let i = 0;
        const ts = () => "[" + ((performance.now() - t0) / 1000 + 0.031).toFixed(6).padStart(10, " ") + "]";
        const step = () => {
            i++;
            setBoot(i);
            setBootLog((prev) => [...prev, `${ts()} node ${names[i - 1]} up`]);
            if (i < 4) {
                setTimeout(step, 120 + Math.random() * 180);
            } else {
                setTimeout(() => {
                    setBootLog((prev) => [...prev, `${ts()} 3 edges established · topology ready`]);
                    setTimeout(() => {
                        if (!everOpenedRef.current) setHintBlink(true);
                    }, 2500);
                }, 160);
            }
        };
        setTimeout(step, 180);
    }, []);

    const runNmap = useCallback(() => {
        const cmd = NMAP_CMD;
        let i = 0;
        let o = 0;
        setTerm((s) => ({ ...s, phase: "typing", cmd: "", out: 0, input: "", date: new Date().toString().slice(0, 24) }));
        const reveal = () => {
            o++;
            setTerm((s) => ({ ...s, phase: o >= 7 ? "done" : "running", out: o }));
            if (o < 7) setTimeout(reveal, o === 1 ? 420 : o === 2 ? 220 : 80);
        };
        const type = () => {
            i++;
            setTerm((s) => ({ ...s, cmd: cmd.slice(0, i) }));
            if (i < cmd.length) setTimeout(type, 26 + Math.random() * 44);
            else setTimeout(reveal, 260);
        };
        type();
    }, []);

    // intersection observers: boot topology, arm nmap auto-run
    useEffect(() => {
        if (!("IntersectionObserver" in window)) {
            bootedRef.current = true;
            setBoot(4);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    if (e.target === topoRef.current && !bootedRef.current) {
                        bootedRef.current = true;
                        boot4();
                    }
                    if (e.target === nmapRef.current && !armedRef.current) {
                        armedRef.current = true;
                        setTimeout(() => {
                            runNmap();
                        }, 2400);
                    }
                });
            },
            { threshold: 0.35 }
        );
        if (topoRef.current) io.observe(topoRef.current);
        if (nmapRef.current) io.observe(nmapRef.current);
        const hardT = setTimeout(() => {
            if (!bootedRef.current) {
                bootedRef.current = true;
                boot4();
            }
        }, 6000);
        return () => {
            io.disconnect();
            clearTimeout(hardT);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // panel autoscroll + focus
    useEffect(() => {
        if (!panel) return;
        const t = setTimeout(() => {
            if (panelBodyRef.current) panelBodyRef.current.scrollTop = panelBodyRef.current.scrollHeight;
            if (panelInputRef.current && document.activeElement !== panelInputRef.current) panelInputRef.current.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [panel, pLines]);

    const openPanel = useCallback(() => {
        everOpenedRef.current = true;
        savedScrollRef.current = window.scrollY;
        setPLines((prev) => {
            if (prev.length > 0) return prev;
            return [
                ...MOTD.map((s): Line => ({ s, c: "#6c7086" })),
                { s: `Last login: ${lastLogin()} from 10.8.0.2`, c: "#6c7086" },
                { s: "`ls` lista las secciones · `cd projects` navega · `help` · [esc] cierra", c: "#45475a" },
            ];
        });
        setPanel(true);
        setHintBlink(false);
    }, []);

    const closePanel = useCallback((keepScroll?: boolean) => {
        setPanel(false);
        setHistIdx(-1);
        if (!keepScroll && savedScrollRef.current != null) {
            window.scrollTo({ top: savedScrollRef.current, behavior: "instant" });
        }
    }, []);

    // global keydown
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
            if (e.key === "`" || e.key === "~") {
                e.preventDefault();
                setPanel((p) => {
                    if (p) closePanel();
                    else openPanel();
                    return p;
                });
                return;
            }
            if (e.key === "Escape") {
                setPanel((p) => {
                    if (p) closePanel();
                    return false;
                });
                if (typing) t.blur();
                return;
            }
            if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === "j" || e.key === "k") {
                const secs = [...document.querySelectorAll("[data-screen-label]")].map(
                    (s) => s.getBoundingClientRect().top + window.scrollY - 40
                );
                const y = window.scrollY;
                const next = e.key === "j" ? secs.find((v) => v > y + 4) : [...secs].reverse().find((v) => v < y - 4);
                window.scrollTo({
                    top: next === undefined ? (e.key === "j" ? document.body.scrollHeight : 0) : next,
                    behavior: "instant",
                });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openPanel, closePanel]);

    const togglePanel = () => {
        if (panel) closePanel();
        else openPanel();
    };

    const toggleProject = (key: string, isOpen: boolean) => {
        if (isOpen) {
            setOpenProjects((s) => ({ ...s, [key]: false }));
            return;
        }
        const p = PROJECTS.find((x) => x.key === key)!;
        const total = p.built.length + p.broke.length + p.fixed.length;
        setOpenProjects((s) => ({ ...s, [key]: true }));
        setTyped((s) => ({ ...s, [key]: 0 }));
        clearInterval(typersRef.current[key]);
        typersRef.current[key] = setInterval(() => {
            setTyped((s) => {
                const cur = (s[key] ?? 0) + 22;
                if (cur >= total) {
                    clearInterval(typersRef.current[key]);
                    return { ...s, [key]: total };
                }
                return { ...s, [key]: cur };
            });
        }, 16);
    };

    useEffect(() => {
        return () => {
            Object.values(typersRef.current).forEach(clearInterval);
        };
    }, []);

    const onTermKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;
        const raw = term.input;
        const c = raw.trim();
        if (!c || c.startsWith("nmap")) {
            runNmap();
            return;
        }
        const msg: Line =
            c === "help"
                ? { s: "acá solo corre nmap. La terminal completa está en [~].", c: "#a6adc8" }
                : { s: `zsh: command not found: ${c.split(" ")[0]}`, c: "#f38ba8" };
        setTerm((s) => ({ ...s, input: "", hist: [...s.hist, { s: `$ ${raw}`, c: "#cdd6f4" }, msg] }));
    };

    const dockerPsSummary = () => `${containerCount} containers running · \`cd services\` para el output completo`;

    const exec = (raw: string) => {
        const c = raw.trim();
        const out: Line[] = [{ s: `$ ${raw}`, c: "#cdd6f4", u: "sysadmin@ar-bue-1:", d: cwd }];
        const p = (s: string, col?: string) => out.push({ s, c: col });
        const err = (s: string) => p(s, "#f38ba8");
        const dim = (s: string) => p(s, "#6c7086");
        const hd = (s: string) => p(s, "#cdd6f4");
        const nextHist = c ? [...cmdHist, c].slice(-50) : cmdHist;
        const done = (extra?: Partial<{ cwd: string; panel: boolean }>) => {
            setPLines((prev) => [...prev, ...out]);
            setPInput("");
            setCmdHist(nextHist);
            setHistIdx(-1);
            if (extra?.cwd !== undefined) setCwd(extra.cwd);
            if (extra?.panel === false) setPanel(false);
        };
        const [cmd, ...args] = c.split(/\s+/);
        const arg = args[0] || "";
        const days = daysSinceStart();
        const up = `${Math.floor(days / 365)}y ${days % 365}d`;
        const cwdSec = cwd === "~" ? null : cwd.replace("~/", "");

        if (!c) return done();
        if (cmd === "clear") {
            setPLines([]);
            setPInput("");
            setCmdHist(nextHist);
            setHistIdx(-1);
            return;
        }
        if (cmd === "exit") {
            setPInput("");
            setCmdHist(nextHist);
            setHistIdx(-1);
            closePanel();
            return;
        }
        if (cmd === "help") {
            p("navegación   ls [dir]   cd <section>   pwd   cat <file>.md   man <project>");
            p("sistema      neofetch   git log --oneline   top   ps aux   docker ps   uptime   whoami   motd");
            p("sesión       history   clear   exit   ↑/↓ recall   tab completa");
            dim("secciones: topology/  services/  projects/  contact/");
            return done();
        }
        if (cmd === "pwd") {
            p(cwd.replace("~", "/home/sysadmin"));
            return done();
        }
        if (cmd === "cd") {
            if (!arg || arg === "~" || arg === ".." || arg === "/") return done({ cwd: "~" });
            const sec = resolveSection(arg);
            if (!sec) {
                err(`cd: no such file or directory: ${arg}`);
                return done();
            }
            scrollToSection(SECTIONS[sec]);
            savedScrollRef.current = null;
            return done({ cwd: `~/${sec}`, panel: false });
        }
        if (cmd === "ls") {
            const target = arg ? resolveSection(arg) : cwdSec;
            if (arg && !target) {
                err(`ls: cannot access '${arg}': No such file or directory`);
                return done();
            }
            if (!target) p("topology/  services/  projects/  contact/  TODO.md");
            else if (target === "projects") p(PROJECTS.map((x) => FILES[x.key]).join("  "));
            else if (target === "services") p(STACK.map((g) => g.group + "/").join("  "));
            else if (target === "topology") p(Object.values(NODES).map((n) => n.id.replace("/", "-")).join("  "));
            else p(PORTS.map((x) => `${x.service}:${x.port}`).join("  "));
            return done();
        }
        if (cmd === "cat") {
            if (arg.toLowerCase().endsWith("todo.md")) {
                p("- [x] rotar logs de nginx");
                p("- [ ] migrar el homelab entero a k3s (abierto desde 2024)");
                p("- [ ] dormir");
                return done();
            }
            const pr = findProj(arg);
            if (!pr) {
                err(`cat: ${arg}: No such file or directory`);
                return done();
            }
            hd(`# ${pr.name} — ${pr.tagline}`);
            dim(`uptime ${pr.uptime} · deploy ${pr.deploy} · ${pr.tags.join(", ")}`);
            p("## BUILT", "#cba6f7");
            p(pr.built);
            p("## INCIDENT", "#cba6f7");
            p(pr.broke);
            p("## RESOLUTION", "#cba6f7");
            p(pr.fixed);
            dim(`stack: ${pr.stack}`);
            return done();
        }
        if (cmd === "man") {
            if (!arg) {
                p("What manual page do you want?");
                dim("For example, try `man homelab`.");
                return done();
            }
            const pr = findProj(arg);
            if (!pr) {
                err(`No manual entry for ${arg}`);
                return done();
            }
            const f = FILES[pr.key].replace(".md", "");
            const U = f.toUpperCase() + "(1)";
            dim(`${U}${" ".repeat(Math.max(1, 60 - U.length * 2))}${U}`);
            hd("NAME");
            p(`       ${f} - ${pr.tagline}`);
            hd("SYNOPSIS");
            p(`       ${f} [--stack ${pr.stack.split(" · ").join(",")}] [--uptime ${pr.uptime}]`);
            hd("DESCRIPTION");
            p(`       ${pr.built}`);
            hd("INCIDENT");
            p(`       ${pr.broke}`);
            hd("RESOLUTION");
            p(`       ${pr.fixed}`);
            hd("SEE ALSO");
            p(`       ${PROJECTS.filter((x) => x !== pr).map((x) => FILES[x.key].replace(".md", "") + "(1)").join(", ")}`);
            return done();
        }
        if (cmd === "history") {
            nextHist.forEach((h, i) => p(`${String(i + 1).padStart(5, " ")}  ${h}`));
            return done();
        }
        if (cmd === "neofetch" || cmd === "fastfetch") {
            const logo = ["   ______   ", "  /     /|  ", " /_____/ |  ", " |     | |  ", " | [ ] | /  ", " |_____|/   "];
            const fields = [
                "sysadmin@ar-bue-1",
                "-----------------",
                `OS: ${NODES.self.meta[0][1]} · ministerio de salud`,
                "Host: ar-bue-1 · Buenos Aires, AR",
                `Kernel: ${NODES.self.meta[1][1]}`,
                `Uptime: ${up}`,
                `Packages: ${containerCount} (docker ps)`,
                "Shell: Jenkins · GitLab CI · Docker · Kubernetes · Ansible",
                `Side: ${NODES.free.meta[0][1]} (freelance)`,
                `Homelab: Docker Compose · Nginx · ${NODES.home.meta[0][1]}`,
                "Terminal: zsh · Fira Code · catppuccin-mocha",
            ];
            fields.forEach((f, i) => out.push({ s: "  " + f, c: i < 2 ? "#cdd6f4" : "#a6adc8", u: "", d: logo[i] || " ".repeat(12) }));
            return done();
        }
        if (c === "git log --oneline" || c === "git log") {
            const commits: [string, string, string][] = [
                ["f2a0c9e", " (HEAD -> main, tag: v2.0.0)", " site: reescritura como interfaz de sistema"],
                ["9d41b7c", "", " dgsisan: 179 servicios · 177 servidores · 8,70M req/día en SIGEHOS"],
                ["b83e05a", "", " dgsisan: CI/CD sobre GitLab CI + kaniko + Ansible, imágenes en Harbor"],
                ["c17d9f4", "", " homelab: DDNS + healthcheck para el peer de WireGuard"],
                ["4e6a2d1", "", " brava: preload de fuentes y dimensiones explícitas, CLS < 0.05"],
                ["71c0ab3", "", " freelance: Brava — sitio para agencia en Next.js/TypeScript"],
                ["0a1f3e8", "", " utn: diplomatura en Desarrollo Web y UX/UI (completada)"],
                ["6b4d81a", "", " homelab: WireGuard + Cloudflare Tunnels, cero puertos expuestos"],
                ["2e9c05f", "", " utn: inicio Tecnicatura en Programación, UTN FRBA"],
            ];
            commits.forEach(([h, d, s]) => out.push({ s, c: "#a6adc8", u: h, d }));
            return done();
        }
        if (cmd === "git") {
            err(`git: '${args.join(" ")}' is not a git command. Probá git log --oneline`);
            return done();
        }
        if (cmd === "top" || c === "ps aux" || cmd === "ps") {
            if (cmd === "top") {
                dim(`top - ${clock} up ${up}, 1 user, load average: 0.18, 0.12, 0.09`);
                dim("Tasks: 5 total, 4 running, 1 sleeping");
            }
            hd("  PID USER      %CPU %MEM COMMAND");
            p(" 1001 sysadmin  42.0 31.5 devops-role --dgsisan --sigehos --critical-infra");
            p(" 1002 sysadmin  23.4 18.2 freelance-react --next --typescript");
            p(" 1003 sysadmin  18.7 22.9 homelab-maintenance --wg0 --cloudflared");
            p(" 1004 sysadmin  15.9 12.1 utn-cursada --ultimo-anio");
            dim("    7 root       0.0  0.4 [kworker/coffee]");
            return done();
        }
        if (c === "whoami") p("sysadmin  uid=1000(sysadmin) gid=999(docker) groups=oncall,coffee,utn");
        else if (c === "motd") MOTD.forEach((s) => p(s, "#6c7086"));
        else if (c === "uptime")
            p(` ${clock}  up ${Math.floor(days / 365)} years, ${days % 365} days,  1 user,  load average: 0.18, 0.12, 0.09`);
        else if (c === "docker ps") p(dockerPsSummary());
        else if (c.startsWith("ping")) {
            p("PING wald16.fun: 64 bytes icmp_seq=1 ttl=57 time=21.3 ms");
            p("64 bytes icmp_seq=2 ttl=57 time=20.9 ms");
            p("--- 2 packets transmitted, 2 received, 0% packet loss ---", "#a6e3a1");
        } else if (c === "sl") {
            p("      ====        ________                ___________ ", "#cba6f7");
            p("  _D _|  |_______/        \\__I_I_____===__|_________| ", "#cba6f7");
            p("   |(_)---  |   H\\________/ |   |        =|___ ___|   ", "#cba6f7");
            p("   /     |  |   H  |  |     |   |         ||_| |_||   ", "#cba6f7");
            p("  |      |  |   H  |__--------------------| [___] |   ", "#cba6f7");
            p("quisiste escribir ls. Todos quisimos escribir ls.", "#6c7086");
        } else if (c.startsWith("sudo")) {
            if (/rm\s+-rf?\s+\/(\s|$)/.test(c) || c.includes("rm -rf /")) {
                err("sudo: rm -rf /: operation refused by policy");
                p("  → esto es prod, no el homelab. Si querés romper algo, ~/homelab existe para eso.", "#6c7086");
                p("  This incident will be reported. (a nadie, pero queda en el log)", "#6c7086");
            } else {
                p("[sudo] password for sysadmin: ", "#a6adc8");
                err("Sorry, try again. 3 incorrect password attempts · sudo: 1 incident reported");
            }
        } else if (c === "rm -rf /" || c.startsWith("rm -rf")) err("rm: permission denied · y sin sudo tampoco.");
        else if (c === "vim" || c === "vi" || c === "nano") p(":q!  — tranquilo, acá se sale con [esc].", "#6c7086");
        else if (c.startsWith("nmap")) p("el scan corre en contact/ — `cd contact`.", "#6c7086");
        else err(`zsh: command not found: ${cmd}`);
        return done();
    };

    const onPanelKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "l" && e.ctrlKey) {
            e.preventDefault();
            setPLines([]);
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const r = complete(pInput);
            if (!r) return;
            if (r.input) setPInput(r.input);
            else if (r.list) setPLines((prev) => [...prev, { s: `$ ${pInput}`, c: "#cdd6f4", u: "sysadmin@ar-bue-1:", d: cwd }, { s: r.list! }]);
            return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            if (!cmdHist.length) return;
            let i = histIdx < 0 ? cmdHist.length : histIdx;
            i += e.key === "ArrowUp" ? -1 : 1;
            i = Math.max(0, Math.min(cmdHist.length, i));
            setHistIdx(i >= cmdHist.length ? -1 : i);
            setPInput(i >= cmdHist.length ? "" : cmdHist[i]);
            return;
        }
        if (e.key === "Enter") exec(pInput);
    };

    const focusNmap = () => nmapInputRef.current?.focus();
    const focusPanel = () => panelInputRef.current?.focus();

    const activeId = hovered || selected;
    const active = NODES[activeId];
    const edge = (k: NodeKey, need: number) => (boot < need ? "transparent" : activeId === k || activeId === "self" ? MAUVE : "#45475a");
    const bootStatus = boot < 4 ? `${boot}/4 nodes up` : "4 nodes · 3 edges";

    return (
        <div className="min-h-screen" style={{ background: BG, color: "#cdd6f4" }}>
            {/* status bar */}
            <div
                data-screen-label="status-bar"
                className="sticky top-0 z-20 h-9 backdrop-blur"
                style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(30,30,46,.92)", fontFamily: "var(--font-fira-code)", fontSize: 11.5 }}
            >
                <div className="max-w-[1180px] mx-auto h-full px-5 flex items-center gap-[22px] relative" style={{ color: "#7f849c" }}>
                    <div
                        onMouseEnter={() => setDotTip(true)}
                        onMouseLeave={() => setDotTip(false)}
                        className="flex items-center gap-2 h-full cursor-help"
                        style={{ color: "#cdd6f4" }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: GREEN,
                                boxShadow: "0 0 0 3px rgba(166,227,161,.15)",
                                opacity: jitter ? 0.25 : 1,
                                transform: `translateX(${jitter ? "1px" : "0px"})`,
                            }}
                        />
                        operational
                    </div>
                    {dotTip && (
                        <div
                            className="absolute left-5 top-[38px] p-[10px_12px] text-[11px] leading-[1.6] grid gap-[2px_14px] z-30 whitespace-nowrap"
                            style={{ background: "#11111b", border: "1px solid #45475a", color: "#a6adc8", gridTemplateColumns: "auto 1fr" }}
                        >
                            <span style={{ color: "#6c7086" }}>last flap</span>
                            <span>2025-11-14 03:12:44 ART</span>
                            <span style={{ color: "#6c7086" }}>cause</span>
                            <span>ISP renovó el lease DHCP · wg0 perdió handshake</span>
                            <span style={{ color: "#6c7086" }}>duration</span>
                            <span>47s · recuperado sin intervención (exit 0 en el 2° retry)</span>
                        </div>
                    )}
                    <div>
                        <span style={{ color: "#6c7086" }}>region</span> ar-bue-1
                    </div>
                    <div title="counter reset 2023-03-01 · día 1 de onboarding">
                        <span style={{ color: "#6c7086" }}>uptime</span> {uptime}
                    </div>
                    <div className="ml-auto flex gap-[22px] items-center">
                        <div>
                            <span style={{ color: "#6c7086" }}>incidents</span> 0 open
                        </div>
                        <div style={{ color: "#cdd6f4", fontVariantNumeric: "tabular-nums" }}>
                            {clock} <span style={{ color: "#6c7086" }}>ART</span>
                        </div>
                        <a
                            href="#eof"
                            title="v1.x era Hero → About → Skills → Projects. Deprecated."
                            className="text-[10.5px] px-[7px] py-[2px] hover:!text-[#cba6f7]"
                            style={{ color: "#7f849c", border: `1px solid ${BORDER}`, transition: "color 80ms steps(2,end), border-color 80ms steps(2,end)" }}
                        >
                            v2.0.0
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-[1180px] mx-auto px-5">
                {/* motd */}
                <div
                    data-screen-label="motd"
                    className="pt-4 flex flex-col text-[11px] leading-[1.7]"
                    style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}
                >
                    <div>
                        <span style={{ color: "#a6adc8" }}>Welcome to ar-bue-1</span> · Debian GNU/Linux 12 (bookworm) · 6.1.0-25-amd64
                    </div>
                    <div>Last login: {lastLoginStr} from 10.8.0.2 (wg0)</div>
                    <div className="flex gap-[26px] flex-wrap">
                        <span>System load: 0.18</span>
                        <span>Processes: 212</span>
                        <span>Users logged in: 1</span>
                        <span>0 updates can be applied immediately.</span>
                    </div>
                </div>

                {/* 1 · topology */}
                <section
                    data-screen-label="topology"
                    className="grid gap-8 pt-14 pb-20"
                    style={{ gridTemplateColumns: "168px 1fr", borderBottom: `1px solid ${BORDER}` }}
                >
                    <div className="text-[11px] leading-[1.8]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                        <div style={{ color: MAUVE }}>01</div>
                        <div>topology</div>
                        <div className="mt-[14px]" style={{ color: "#7f849c" }}>
                            {bootStatus}
                            <br />
                            hover / click para inspeccionar
                        </div>
                    </div>
                    <div className="grid gap-7 items-stretch" style={{ gridTemplateColumns: "minmax(0,1.25fr) minmax(300px,.85fr)" }}>
                        <div ref={topoRef} className="relative h-[380px]" style={{ border: `1px solid ${BORDER}`, background: "#11111b" }}>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="50" y1="50" x2="18" y2="20" stroke={edge("work", 2)} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                <line x1="50" y1="50" x2="84" y2="24" stroke={edge("free", 3)} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                <line x1="50" y1="50" x2="60" y2="86" stroke={edge("home", 4)} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            </svg>
                            {NODE_ORDER.map((k, i) => {
                                const n = NODES[k];
                                const isActive = k === activeId;
                                return (
                                    <button
                                        key={k}
                                        onMouseEnter={() => setHovered(k)}
                                        onMouseLeave={() => setHovered(null)}
                                        onClick={() => {
                                            setSelected(k);
                                            setHovered(null);
                                        }}
                                        className="absolute flex flex-col items-start gap-[3px] px-3 py-[9px] text-left cursor-pointer"
                                        style={{
                                            left: n.x,
                                            top: n.y,
                                            transform: "translate(-50%,-50%)",
                                            opacity: i < boot ? 1 : 0,
                                            pointerEvents: i < boot ? "auto" : "none",
                                            background: isActive ? GREEN_DIM : BG,
                                            border: `1px solid ${isActive ? MAUVE : k === "self" ? "#585b70" : BORDER}`,
                                            color: "#cdd6f4",
                                            fontFamily: "var(--font-fira-code)",
                                            fontSize: 11.5,
                                            minWidth: 128,
                                            transition: "border-color 80ms steps(2,end), background 80ms steps(2,end)",
                                        }}
                                    >
                                        <span className="flex items-center gap-[7px] font-medium" style={{ color: "#cdd6f4" }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
                                            {n.id}
                                        </span>
                                        <span className="text-[10.5px]" style={{ color: "#7f849c" }}>
                                            {n.sub}
                                        </span>
                                    </button>
                                );
                            })}
                            <div className="absolute left-3 bottom-[10px] text-[10px] leading-[1.6] pointer-events-none" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                                {bootLog.map((b, i) => (
                                    <div key={i}>{b}</div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-[14px] p-[20px_22px]" style={{ border: `1px solid ${BORDER}`, background: "#181825", minHeight: 380 }}>
                            <div className="flex justify-between text-[11px]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                                <span>describe node/{active.id}</span>
                                <span style={{ color: GREEN }}>{active.state}</span>
                            </div>
                            <h1 className="m-0 text-[22px] font-semibold leading-[1.2]" style={{ letterSpacing: "-.01em", color: "#cdd6f4" }}>
                                {active.title}
                            </h1>
                            <p className="m-0 text-[14.5px] leading-[1.6]" style={{ color: "#a6adc8" }}>
                                {active.body}
                            </p>
                            <div
                                className="mt-auto grid gap-[6px_16px] pt-[14px] text-[11.5px]"
                                style={{ gridTemplateColumns: "auto 1fr", fontFamily: "var(--font-fira-code)", borderTop: `1px solid ${BORDER}` }}
                            >
                                {active.meta.map(([k, v]) => (
                                    <Fragment key={k}>
                                        <span style={{ color: "#6c7086" }}>{k}</span>
                                        <span style={{ color: "#cdd6f4" }}>{v}</span>
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2 · stack */}
                <section
                    data-screen-label="services"
                    className="grid gap-8 pt-9 pb-11"
                    style={{ gridTemplateColumns: "168px 1fr", borderBottom: `1px solid ${BORDER}` }}
                >
                    <div className="text-[11px] leading-[1.8]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                        <div style={{ color: MAUVE }}>02</div>
                        <div>services</div>
                        <div className="mt-[14px]" style={{ color: "#7f849c" }}>
                            {containerCount} running
                            <br />
                            hover → notas de operación
                        </div>
                    </div>
                    <div data-term="1" className="text-[12px]" style={{ fontFamily: "var(--font-fira-code)", border: `1px solid ${BORDER}`, background: "#181825" }}>
                        <div className="pt-[10px] px-4 text-[11.5px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "#a6adc8" }}>
                            <span style={{ color: "#6c7086" }}>$</span> {DOCKER_CMD}
                        </div>
                        <div
                            className="grid gap-3 py-[9px] px-4 text-[10.5px] tracking-[.06em]"
                            style={{ gridTemplateColumns: "2fr 1.6fr 1.2fr 1fr", color: "#6c7086", borderBottom: `1px solid ${BORDER}` }}
                        >
                            <span>NAMES</span>
                            <span>IMAGE</span>
                            <span>STATUS</span>
                            <span className="text-right">UPTIME</span>
                        </div>
                        {STACK.map((g) => (
                            <div key={g.group}>
                                <div className="flex items-center gap-[10px] py-[10px] px-4 pb-1 text-[10.5px] tracking-[.06em]" style={{ color: GREEN }}>
                                    <span># {g.group}</span>
                                    <span className="flex-1 h-px" style={{ background: BORDER }} />
                                </div>
                                {g.items.map((c) => (
                                    <div
                                        key={c.name}
                                        title={c.note}
                                        className="grid gap-3 items-center py-[6px] px-4 hover:!bg-[#313244]"
                                        style={{ gridTemplateColumns: "2fr 1.6fr 1.2fr 1fr", color: "#cdd6f4", transition: "background 80ms steps(2,end)" }}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN }} />
                                            {c.name}
                                            <span className="text-[10px]" style={{ color: "#6c7086" }}>
                                                {c.note ? "*" : ""}
                                            </span>
                                        </span>
                                        <span style={{ color: "#7f849c" }}>{c.image}</span>
                                        <span style={{ color: "#a6adc8" }}>
                                            Up <span style={{ color: "#7f849c" }}>({c.health})</span>
                                        </span>
                                        <span className="text-right" style={{ color: "#7f849c", fontVariantNumeric: "tabular-nums" }}>
                                            {c.up}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="h-2" />
                    </div>
                </section>

                {/* 3 · projects */}
                <section
                    data-screen-label="projects"
                    className="grid gap-8 pt-16 pb-[88px]"
                    style={{ gridTemplateColumns: "168px 1fr", borderBottom: `1px solid ${BORDER}` }}
                >
                    <div className="text-[11px] leading-[1.8]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                        <div style={{ color: MAUVE }}>03</div>
                        <div>status</div>
                        <div className="mt-[14px]" style={{ color: "#7f849c" }}>
                            {PROJECTS.length} services
                            <br />
                            click → incident report
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {PROJECTS.map((proj) => {
                            const open = !!openProjects[proj.key];
                            const typedCount = typed[proj.key] ?? Infinity;
                            const total = proj.built.length + proj.broke.length + proj.fixed.length;
                            const done = typedCount >= total;
                            const seg = (txt: string, off: number) => {
                                const n = typedCount - off;
                                if (n <= 0) return "";
                                return n >= txt.length ? txt : txt.slice(0, n) + "▍";
                            };
                            return (
                                <div key={proj.key} style={{ border: `1px solid ${open ? "#585b70" : BORDER}`, background: "#181825", transition: "border-color 80ms steps(2,end)" }}>
                                    <button
                                        onClick={() => toggleProject(proj.key, open)}
                                        className="w-full grid gap-[14px] items-center text-left cursor-pointer hover:!bg-[#313244]"
                                        style={{
                                            gridTemplateColumns: "14px 1.6fr 90px 130px 1fr 16px",
                                            padding: proj.featured ? "16px 20px" : "11px 20px",
                                            background: "transparent",
                                            border: 0,
                                            color: "#cdd6f4",
                                            fontFamily: "var(--font-fira-code)",
                                            fontSize: 12,
                                            transition: "background 80ms steps(2,end)",
                                        }}
                                    >
                                        <span className="justify-self-center" style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN }} />
                                        <span className="flex flex-col gap-[2px]">
                                            <span
                                                className="font-semibold"
                                                style={{ fontFamily: "var(--font-space-grotesk)", fontSize: proj.featured ? 16 : 13.5, color: "#cdd6f4", letterSpacing: "-.01em" }}
                                            >
                                                {proj.name}
                                            </span>
                                            <span className="text-[11px]" style={{ color: "#7f849c" }}>
                                                {proj.tagline}
                                            </span>
                                        </span>
                                        <span style={{ color: "#a6adc8", fontVariantNumeric: "tabular-nums" }}>{proj.uptime}</span>
                                        <span className="text-[11px]" style={{ color: "#7f849c" }}>
                                            deploy {proj.deploy}
                                        </span>
                                        <span className="flex gap-[5px] flex-wrap">
                                            {proj.tags.map((t) => (
                                                <span key={t} className="text-[10px] px-[6px] py-[1px]" style={{ border: "1px solid #45475a", color: "#a6adc8" }}>
                                                    {t}
                                                </span>
                                            ))}
                                        </span>
                                        <span className="text-[11px]" style={{ color: "#6c7086" }}>
                                            {open ? "−" : "+"}
                                        </span>
                                    </button>
                                    {open && (
                                        <div
                                            className="grid gap-6 text-[13.5px] leading-[1.6]"
                                            style={{ borderTop: `1px solid ${BORDER}`, padding: "18px 20px 20px 48px", gridTemplateColumns: "1.2fr 1fr 1fr", color: "#a6adc8" }}
                                        >
                                            <div>
                                                <div className="text-[10.5px] tracking-[.06em] mb-[6px]" style={{ fontFamily: "var(--font-fira-code)", color: MAUVE }}>
                                                    ## BUILT
                                                </div>
                                                <p className="m-0" style={{ minHeight: "1.6em" }}>
                                                    {seg(proj.built, 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-[10.5px] tracking-[.06em] mb-[6px]" style={{ fontFamily: "var(--font-fira-code)", color: MAUVE }}>
                                                    ## INCIDENT
                                                </div>
                                                <p className="m-0" style={{ minHeight: "1.6em" }}>
                                                    {seg(proj.broke, proj.built.length)}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-[10.5px] tracking-[.06em] mb-[6px]" style={{ fontFamily: "var(--font-fira-code)", color: MAUVE }}>
                                                    ## RESOLUTION
                                                </div>
                                                <p className="m-0" style={{ minHeight: "1.6em" }}>
                                                    {seg(proj.fixed, proj.built.length + proj.broke.length)}
                                                </p>
                                            </div>
                                            <div
                                                className="flex gap-4 items-center pt-3 text-[11.5px]"
                                                style={{ gridColumn: "1/-1", borderTop: `1px solid ${BORDER}`, color: "#7f849c", opacity: done ? 1 : 0, fontFamily: "var(--font-fira-code)" }}
                                            >
                                                <span style={{ color: "#6c7086" }}>stack</span>
                                                <span style={{ color: "#cdd6f4" }}>{proj.stack}</span>
                                                <a href={proj.href} target="_blank" rel="noreferrer" className="ml-auto">
                                                    {proj.linkLabel} →
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4 · contact */}
                <section
                    data-screen-label="contact"
                    className="grid gap-8 py-10"
                    style={{ gridTemplateColumns: "168px 1fr", borderBottom: `1px solid ${BORDER}` }}
                >
                    <div className="text-[11px] leading-[1.8]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                        <div style={{ color: MAUVE }}>04</div>
                        <div>endpoints</div>
                        <div className="mt-[14px]" style={{ color: "#7f849c" }}>
                            {PORTS.length} ports open
                            <br />
                            abierto a propuestas
                        </div>
                    </div>
                    <div className="grid gap-7 items-start" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(260px,.7fr)" }}>
                        <div
                            ref={nmapRef}
                            data-term="1"
                            onClick={focusNmap}
                            className="text-[12.5px] leading-[1.75]"
                            style={{ border: `1px solid ${BORDER}`, background: "#181825", padding: "18px 20px", color: "#a6adc8", minHeight: 250, fontFamily: "var(--font-fira-code)" }}
                        >
                            {term.hist.map((h, i) => (
                                <div key={i} style={{ color: h.c }}>
                                    {h.s}
                                </div>
                            ))}
                            {term.phase !== "idle" && (
                                <div>
                                    <span style={{ color: "#6c7086" }}>$</span> <span style={{ color: "#cdd6f4" }}>{term.cmd}</span>
                                    {term.phase === "typing" && (
                                        <span className="inline-block ml-px" style={{ width: 8, height: 14, background: GREEN, verticalAlign: -2 }} />
                                    )}
                                </div>
                            )}
                            {term.out >= 1 && <div style={{ color: "#6c7086" }}>Starting Nmap 7.94 ( https://nmap.org ) at {term.date}</div>}
                            {term.out >= 2 && <div style={{ color: "#6c7086" }}>Nmap scan report for wald16.fun · Host is up (0.021s latency).</div>}
                            {term.out >= 3 && (
                                <div className="grid gap-3 mt-2 text-[10.5px] tracking-[.06em]" style={{ gridTemplateColumns: "90px 60px 100px 1fr", color: "#6c7086" }}>
                                    <span>PORT</span>
                                    <span>STATE</span>
                                    <span>SERVICE</span>
                                    <span>VERSION</span>
                                </div>
                            )}
                            {PORTS.map(
                                (pt, i) =>
                                    term.out >= 4 + i && (
                                        <a
                                            key={pt.port}
                                            href={pt.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="grid gap-3 py-[2px] px-[6px] -mx-[6px] hover:!bg-[#313244]"
                                            style={{ gridTemplateColumns: "90px 60px 100px 1fr", color: "#cdd6f4", transition: "background 80ms steps(2,end)" }}
                                        >
                                            <span>{pt.port}</span>
                                            <span style={{ color: GREEN }}>open</span>
                                            <span>{pt.service}</span>
                                            <span style={{ color: "#7f849c" }}>{pt.version}</span>
                                        </a>
                                    )
                            )}
                            {term.out >= 7 && <div className="mt-2" style={{ color: "#6c7086" }}>Nmap done: 1 IP address (1 host up) scanned in 0.34s</div>}
                            {(term.phase === "idle" || term.phase === "done") && (
                                <>
                                    <div className="flex relative mt-1">
                                        <span style={{ color: "#6c7086" }}>$&nbsp;</span>
                                        <span className="whitespace-pre" style={{ color: "#cdd6f4" }}>
                                            {term.input}
                                        </span>
                                        <span className="mt-1" style={{ width: 8, height: 14, background: GREEN, animation: "blink 1s steps(1) infinite" }} />
                                        <input
                                            ref={nmapInputRef}
                                            value={term.input}
                                            onChange={(e) => setTerm((s) => ({ ...s, input: e.target.value }))}
                                            onKeyDown={onTermKey}
                                            autoComplete="off"
                                            aria-label="terminal"
                                            className="absolute inset-0 w-full opacity-0 border-0 bg-transparent p-0 m-0"
                                            style={{ font: "inherit" }}
                                        />
                                    </div>
                                    {term.phase === "idle" && term.hist.length === 0 && (
                                        <div className="text-[11px]" style={{ color: "#45475a" }}>
                                            enter → correr el scan · o esperá, corre solo
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="text-[14.5px] leading-[1.6] flex flex-col gap-3" style={{ color: "#a6adc8" }}>
                            <p className="m-0">
                                Cualquiera de los tres puertos responde. Para roles DevOps/SRE, infraestructura o producto full-stack, el más rápido es{" "}
                                <a href="mailto:manuwald16@gmail.com">smtp</a>.
                            </p>
                            <div className="grid gap-[4px_14px] text-[11.5px]" style={{ gridTemplateColumns: "auto 1fr", fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                                <span>location</span>
                                <span style={{ color: "#7f849c" }}>Buenos Aires, AR · remote ok</span>
                                <span>latency</span>
                                <span style={{ color: "#7f849c" }}>respuesta &lt; 24h</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5 · footer */}
                <footer id="eof" data-screen-label="footer" className="flex justify-between gap-4 flex-wrap py-[22px] pb-11 text-[11px]" style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086" }}>
                    <span>
                        <span style={{ color: "#7f849c" }}>{buildStamp}</span> INFO  site/v2.0.0 served from ar-bue-1 · built with React, no frameworks harmed
                    </span>
                    <span>© {year} Manuel Wald · EOF</span>
                </footer>
            </div>

            {/* keybinds */}
            <div
                className="fixed left-4 bottom-3 flex gap-[14px] z-30 pointer-events-none text-[10px] px-[6px] py-[3px]"
                style={{ fontFamily: "var(--font-fira-code)", color: "#6c7086", background: "rgba(30,30,46,.85)" }}
            >
                <span>
                    <span style={{ color: "#a6adc8" }}>[j/k]</span> section
                </span>
                <span>
                    <span style={{ color: "#a6adc8", display: "inline-block", animation: hintBlink ? "blink .5s steps(1) 4" : "none" }}>[~]</span> terminal
                </span>
                <span>
                    <span style={{ color: "#a6adc8" }}>[esc]</span> close
                </span>
            </div>

            {/* floating terminal */}
            {panel && (
                <div
                    data-term="1"
                    className="fixed right-5 bottom-10 flex flex-col z-40 text-[12px]"
                    style={{
                        width: 640,
                        maxWidth: "calc(100vw - 40px)",
                        height: 380,
                        background: "#11111b",
                        border: "1px solid #45475a",
                        boxShadow: "0 16px 48px rgba(0,0,0,.55)",
                        fontFamily: "var(--font-fira-code)",
                    }}
                >
                    <div className="flex justify-between items-center px-[10px] py-[5px] text-[10.5px]" style={{ borderBottom: `1px solid ${BORDER}`, color: "#6c7086" }}>
                        <span className="flex gap-[6px]">
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#45475a" }} />
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#45475a" }} />
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN }} />
                        </span>
                        <span>
                            <span style={{ color: "#a6adc8" }}>sysadmin@ar-bue-1</span>:{cwd} — zsh
                        </span>
                        <span>[esc] close</span>
                    </div>
                    <div ref={panelBodyRef} onClick={focusPanel} className="flex-1 overflow-auto px-3 py-[10px] leading-[1.6]">
                        {pLines.map((l, i) => (
                            <div key={i} className="whitespace-pre-wrap" style={{ color: l.c }}>
                                <span style={{ color: GREEN }}>{l.u}</span>
                                <span style={{ color: MAUVE }}>{l.d}</span>
                                {l.s}
                            </div>
                        ))}
                        <div className="flex relative whitespace-pre">
                            <span style={{ color: GREEN }}>sysadmin@ar-bue-1</span>
                            <span style={{ color: "#cdd6f4" }}>:</span>
                            <span style={{ color: MAUVE }}>{cwd}</span>
                            <span style={{ color: "#cdd6f4" }}>$ </span>
                            <span style={{ color: "#cdd6f4" }}>{pInput}</span>
                            <span className="mt-[3px]" style={{ width: 8, height: 14, background: GREEN, animation: "blink 1s steps(1) infinite" }} />
                            <input
                                ref={panelInputRef}
                                value={pInput}
                                onChange={(e) => {
                                    setPInput(e.target.value);
                                    setHistIdx(-1);
                                }}
                                onKeyDown={onPanelKey}
                                autoComplete="off"
                                aria-label="terminal"
                                className="absolute inset-0 w-full opacity-0 border-0 bg-transparent p-0 m-0"
                                style={{ font: "inherit" }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-2 py-[2px] text-[10.5px] whitespace-pre" style={{ background: "#313244", color: "#a6adc8" }}>
                        <span>
                            <span style={{ background: GREEN, color: "#11111b", padding: "0 6px" }}>[ar-bue-1]</span>{" "}
                            <span style={{ color: "#cdd6f4" }}>0:zsh*</span> <span style={{ color: "#6c7086" }}>1:nmap-</span>
                        </span>
                        <span style={{ color: "#6c7086" }}>
                            tab · ↑↓ · ctrl+l <span style={{ color: "#cdd6f4" }}>{clock}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
