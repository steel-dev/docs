import { Brackets, Database } from "lucide-react";
import Image from "next/image";
import { Card, Cards, SmallCard } from "@/components/card";
import {
  API,
  BrowserUseIcon,
  ClaudeIcon,
  Cloud,
  Container,
  MagicIcon,
  OpenAIIcon,
  PythonIcon,
  TSIcon,
} from "@/components/ui/icon";
import SteelLogo from "@/public/images/logo.png";
import { LiquidMetal as LiquidMetal1 } from "@paper-design/shaders-react";

export default function HomePage() {
  return (
    <main className="space-y-10 max-w-[1024px] w-full mx-auto ">
      <div className="px-8 py-[56px]">
        <div className="space-y-10">
          <div className="space-y-1">
            <div className="flex space-x-6 items-end">
              <LiquidMetal1
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
                  borderRadius: "12px",
                  height: "188px",
                  width: "188px",
                }}
              />
              <div className="flex flex-col [&_p]:mb-6 space-y-3">
                <h3 className="text-3xl">Steel Documentation</h3>
                <p>Find all the guides and resources you need to build on the Steel API.</p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <Cards className="!grid-cols-1">
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
          </div>
          <div className="flex flex-col">
            <h4 id="explore-by-category" className="text-muted-foreground scroll-m-20">
              <a href="#explore-by-category" className="not-prose group text-sm uppercase">
                Integrations
              </a>
            </h4>
            <hr className="border-t border-border my-2" />
            <Cards className="xl:!grid-cols-3">
              <SmallCard
                icon={<BrowserUseIcon />}
                href="/integrations/browser-use/overview"
                title="Browser-Use Integration"
                description="Use Browser-Use to interact with a Steel browser."
              />
              <SmallCard
                icon={<ClaudeIcon />}
                href="/integrations/claude-computer-use/overview"
                title="Claude Computer Use"
                description="Use Claude Computer Use with Steel Browser."
              />
              <SmallCard
                icon={<OpenAIIcon />}
                href="/integrations/openai-computer-use/overview"
                title="OpenAI Computer Use"
                description="Use OpenAI Computer Use with Steel Browser."
              />
              <SmallCard
                icon={<Cloud />}
                href="/integrations/crewai/overview"
                title="CrewAI"
                description="Learn how to use CrewAI with Steel Browser."
              />
              <SmallCard
                icon={<Container />}
                href="/integrations/magnitude/quickstart"
                title="Magnitude"
                description="Use Magnitude with Steel Browser."
              />
              <SmallCard
                icon={<MagicIcon />}
                href="/integrations/notte/quickstart"
                title="Notte"
                description="Use Notte with Steel Browser."
              />
            </Cards>
          </div>
          <div className="flex flex-col">
            <h4 id="explore-by-category" className="text-muted-foreground scroll-m-20">
              <a href="#explore-by-category" className="not-prose group text-sm uppercase">
                Libraries &amp; SDKs
              </a>
            </h4>
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
            </Cards>
          </div>
          <div className="flex flex-col">
            <h4 id="explore-by-category" className="text-muted-foreground scroll-m-20">
              <a href="#explore-by-category" className="not-prose group text-sm uppercase">
                Resources
              </a>
            </h4>
            <hr className="border-t border-border my-2" />
            <Cards>
              <SmallCard
                icon={<API />}
                href="/api-reference"
                title="API Reference"
                description="View the Steel API reference."
              />
              <SmallCard
                icon={<Database />}
                href="/playground"
                title="Playground"
                description="Explore the examples and quick-start guides in Steel playground."
              />
            </Cards>
          </div>
        </div>
      </div>
    </main>
  );
}
