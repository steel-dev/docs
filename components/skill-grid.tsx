import Link from 'fumadocs-core/link';
import { Badge } from '@/components/ui/badge';

const SKILLS = [
  {
    name: 'steel-browser',
    title: 'Steel Browser',
    category: 'Operate',
    stage: 'GA',
    description:
      'Live browser tasks: scrape, click, fill forms, capture screenshots, and create PDFs.',
    href: '/overview/skills/available-skills/steel-browser',
  },
  {
    name: 'steel-developer',
    title: 'Steel Developer',
    category: 'Build',
    stage: 'GA',
    description:
      'Reusable Steel code with SDKs, REST APIs, Playwright, Puppeteer, Stagehand, and Browser Use.',
    href: '/overview/skills/available-skills/steel-developer',
  },
  {
    name: 'steel-session-debugging',
    title: 'Steel Session Debugging',
    category: 'Debug',
    stage: 'Beta',
    description:
      'Failed-session diagnosis from metadata, logs, traces, replay links, and network evidence.',
    href: '/overview/skills/available-skills/steel-session-debugging',
  },
  {
    name: 'steel-reliability',
    title: 'Steel Reliability',
    category: 'Reliability',
    stage: 'Beta',
    description:
      'Bot-detection, CAPTCHA, proxy, identity, login persistence, pacing, and retry guidance.',
    href: '/overview/skills/available-skills/steel-reliability',
  },
  {
    name: 'steel-skill-creator',
    title: 'Steel Skill Creator',
    category: 'Create',
    stage: 'Beta',
    description: 'Turn recurring browser workflows into reusable, parameterized agent skills.',
    href: '/overview/skills/available-skills/steel-skill-creator',
  },
];

export function SkillGrid() {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SKILLS.map((skill) => (
        <Link
          key={skill.name}
          href={skill.href}
          className="not-prose group block rounded-lg border border-border p-5 transition-colors hover:bg-card"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-normal leading-tight text-card-foreground">{skill.title}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{skill.name}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Badge variant="outline">{skill.category}</Badge>
              {/* <Badge variant="secondary">{skill.stage}</Badge> */}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{skill.description}</p>
        </Link>
      ))}
    </div>
  );
}
