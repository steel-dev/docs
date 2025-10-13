import { Cards, IndexCard } from "@/components/card";
import {
  API,
  BrowserUseIcon,
  ClaudeIcon,
  OpenAIIcon,
  Cloud,
  Container,
  MagicIcon,
} from "@/components/ui/icon";

export default function IntegrationsPage() {
  return (
    <main className="my-6 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)]">
        <div className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-3xl">Integrations</h3>
            <hr className="border-t border-border mt-8" />
          </div>
          <Cards>
            <IndexCard
              icon={<BrowserUseIcon />}
              href="/integrations/browser-use/overview"
              title="Browser-Use Integration"
              tag="Browser Agent"
              description="Use Browser-Use to interact with a Steel browser."
            />
            <IndexCard
              icon={<ClaudeIcon />}
              href="/integrations/claude-computer-use/overview"
              title="Claude Computer Use"
              tag="Browser Agent"
              description="Use Claude Computer Use with Steel Browser."
            />
            <IndexCard
              icon={<OpenAIIcon />}
              href="/integrations/openai-computer-use/overview"
              title="OpenAI Computer Use"
              tag="Browser Agent"
              description="Use OpenAI Computer Use with Steel Browser."
            />
            <IndexCard
              icon={<Cloud />}
              href="/integrations/crewai/overview"
              title="CrewAI"
              tag="Multi-Agent"
              description="Learn how to use CrewAI with Steel Browser."
            />
            <IndexCard
              icon={<Container />}
              href="/integrations/magnitude/quickstart"
              title="Magnitude"
              tag="Browser Agent"
              description="Use Magnitude with Steel Browser."
            />
            <IndexCard
              icon={<MagicIcon />}
              href="/integrations/notte/quickstart"
              title="Notte"
              tag="Browser Agent"
              description="Use Notte with Steel Browser."
            />
          </Cards>
        </div>
      </div>
    </main>
  );
}
