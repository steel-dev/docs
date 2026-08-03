import { LiquidMetal as LiquidMetal1 } from '@paper-design/shaders-react';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Card, Cards, SmallCard } from '@/components/card';
import { CLIInstallCard } from '@/components/home/cli-install-card';
import {
  API,
  BrowserUseIcon,
  ClaudeIcon,
  Cloud,
  Container,
  GeminiIcon,
  GoIcon,
  OpenAIIcon,
  PythonIcon,
  RustIcon,
  TSIcon,
} from '@/components/ui/icon';
import SteelLogo from '@/public/images/logo.png';

export default function HomePage() {
  return (
    <div className="space-y-10 max-w-[1024px] w-full mx-auto ">
      <div className="px-6 py-10 sm:px-8 sm:py-14">
        <div className="space-y-10">
          <header className="space-y-1">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <LiquidMetal1
                className="shrink-0 self-center sm:self-auto"
                image={SteelLogo as HTMLImageElement}
                speed={1}
                colorBack="#00000000"
                colorTint="#FFFFFF"
                softness={0.1}
                repetition={2}
                shiftRed={0.3}
                shiftBlue={0.3}
                distortion={0.07}
                contour={0.4}
                scale={1}
                rotation={0}
                angle={70}
                style={{
                  borderRadius: '12px',
                  height: '188px',
                  width: '188px',
                }}
              />
              <div className="flex min-w-0 flex-col space-y-3">
                <h1 className="text-3xl">Steel Documentation</h1>
                <p>
                  Steel is the open-source browser API for AI agents — managed cloud browsers with
                  stealth, residential proxies, CAPTCHA solving, persistent profiles, session
                  replays, and agent observability. Use these docs to create cloud browser sessions
                  and connect your automation tools.
                </p>
              </div>
            </div>
          </header>
          <section className="space-y-5" aria-labelledby="getting-started-and-apis">
            <h2 id="getting-started-and-apis" className="sr-only">
              Getting started and APIs
            </h2>
            <Cards>
              <CLIInstallCard />
              <Card
                className="group space-y-1"
                href="/overview/sessions-api/overview"
                variant="default"
                title="Sessions API"
                description="Explore API endpoints for managing Steel Sessions."
                tags={['API', 'Sessions']}
              />
            </Cards>
            <Cards className="xl:!grid-cols-4">
              <Card
                className="group space-y-1"
                href="/overview/captchas-api/overview"
                variant="default"
                title="Captchas API"
                description="Explore API endpoints for managing Steel Captchas."
                tags={['API', 'Captchas']}
              />
              <Card
                className="group space-y-1"
                href="/overview/extensions-api/overview"
                variant="default"
                title="Extensions API"
                description="Explore API endpoints for building on Steel."
                tags={['API', 'Extensions']}
              />
              <Card
                className="group space-y-1"
                href="/overview/credentials-api/overview"
                title="Credentials API"
                description="Explore API endpoints for managing Steel Credentials."
                tags={['API', 'Credentials']}
              />
              <Card
                className="group space-y-1"
                href="/overview/files-api/overview"
                title="Files API"
                description="Explore API Endpoints for managing Files on Steel."
                tags={['API', 'Files']}
              />
            </Cards>
          </section>
          <section className="flex flex-col">
            <h2 id="integrations" className="text-muted-foreground scroll-m-20">
              <a href="#integrations" className="not-prose group text-sm uppercase">
                Integrations
              </a>
            </h2>
            <hr className="border-t border-border my-2" />
            <Cards className="xl:!grid-cols-3">
              <SmallCard
                icon={<GeminiIcon />}
                href="/integrations/gemini-computer-use"
                title="Gemini Computer Use"
                description="Use Gemini Computer Use with Steel Browser."
              />
              <SmallCard
                icon={<ClaudeIcon />}
                href="/integrations/claude-computer-use"
                title="Claude Computer Use"
                description="Use Claude Computer Use with Steel Browser."
              />
              <SmallCard
                icon={<OpenAIIcon />}
                href="/integrations/openai-computer-use"
                title="OpenAI Computer Use"
                description="Use OpenAI Computer Use with Steel Browser."
              />
              <SmallCard
                icon={<BrowserUseIcon />}
                href="/integrations/browser-use"
                title="Browser-Use"
                description="Use Browser-Use to interact with a Steel browser."
              />
              <SmallCard
                icon={<Container />}
                href="/integrations/magnitude"
                title="Magnitude"
                description="Use Magnitude with Steel Browser."
              />
              <SmallCard
                icon={<Cloud />}
                href="/integrations/crewai"
                title="CrewAI"
                description="Learn how to use CrewAI with Steel Browser."
              />
            </Cards>
          </section>
          <section className="flex flex-col">
            <h2 id="sdks" className="text-muted-foreground scroll-m-20">
              <a href="#sdks" className="not-prose group text-sm uppercase">
                Libraries &amp; SDKs
              </a>
            </h2>
            <hr className="border-t border-border my-2" />
            <Cards>
              <SmallCard
                icon={<TSIcon />}
                href="/steel-js-sdk"
                title="Steel Typescript SDK"
                description="Typescript SDK for building applications on Steel."
              />
              <SmallCard
                icon={<PythonIcon />}
                href="/steel-python-sdk"
                title="Steel Python SDK"
                description="Python SDK for building applications on Steel."
              />
              <SmallCard
                icon={<RustIcon />}
                href="/steel-rust-sdk"
                title="Steel Rust SDK"
                description="Rust SDK for building applications on Steel."
              />
              <SmallCard
                icon={<GoIcon />}
                href="/steel-go-sdk"
                title="Steel Go SDK"
                description="Go SDK for building applications on Steel."
              />
            </Cards>
          </section>
          <section className="flex flex-col">
            <h2 id="resources" className="text-muted-foreground scroll-m-20">
              <a href="#resources" className="not-prose group text-sm uppercase">
                Resources
              </a>
            </h2>
            <hr className="border-t border-border my-2" />
            <Cards>
              <SmallCard
                icon={<API />}
                href="/api-reference"
                title="API Reference"
                description="View the Steel API reference."
              />
              <SmallCard
                icon={<Sparkles />}
                href="/llms.txt"
                title="Instructions for AI Agents"
                description="Point your agent to docs.steel.dev/llms.txt for a fast start with Steel."
              />
            </Cards>
          </section>
        </div>
      </div>
    </div>
  );
}
