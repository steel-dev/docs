import { Database } from "lucide-react";
import { Card, Cards, SmallCard } from "@/components/card";
import { API, Js, StacksIcon } from "@/components/ui/icon";
import SteelLogo from "@/public/images/logo.png";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)] py-[56px]">
        <div className="space-y-10">
          <div className="space-y-1">
            <div className="flex space-x-6 items-end">
              <Image
                alt="metallic logo"
                src={SteelLogo}
                width={188}
                height={140}
                className="mt-0 mb-6 first-line:rounded-md bg-background"
                priority
              />
              <div className="flex flex-col [&_p]:mb-6 space-y-3">
                <h3 className="text-3xl">Steel Documentation</h3>
                <p>
                  Find all the guides and resources you need to build on the
                  Steel API.
                </p>
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
                tags={["API", "Sessions"]}
              />
            </Cards>
            <Cards className="xl:!grid-cols-4">
              <Card
                className="group space-y-1"
                href="/overview/captchas-api/overview"
                variant="default"
                title="Captchas API"
                description="Explore API endpoints for managing Steel Captchas."
                tags={["API", "Captchas"]}
              />
              <Card
                className="group space-y-1"
                href="/overview/extensions-api/overview"
                variant="default"
                title="Extensions API"
                description="Explore API endpoints for building on Steel."
                tags={["API", "Extensions"]}
              />
              <Card
                className="group space-y-1"
                href="/overview/credentials-api/overview"
                title="Credentials API"
                description="Explore API endpoints for managing Steel Credentials."
                tags={["API", "Credentials"]}
              />
              <Card
                className="group space-y-1"
                href="/overview/files-api/overview"
                title="Files API"
                description="Explore API Endpoints for managing Files on Steel."
                tags={["API", "Files"]}
              />
            </Cards>
          </div>
          <div className="flex flex-col">
            <h4
              id="explore-by-category"
              className="text-muted-foreground scroll-m-20"
            >
              <a
                href="#explore-by-category"
                className="not-prose group text-sm uppercase"
              >
                Starters
              </a>
            </h4>
            <hr className="border-t border-border my-2" />
            <Cards className="xl:!grid-cols-3">
              <SmallCard
                href="/integrations/browser-use/overview"
                title="Browser-Use Starter"
                icon={<Database />}
                description="Use Browser-use to interact with the Steel API."
              />
              <SmallCard
                href="/cookbook/credentials-starter"
                title="Credentials API Starter"
                icon={<StacksIcon />}
                description="Use the Steel Credentials API to securely store and manage user credentials."
              />
              <SmallCard
                href="/cookbook/auth-context-starter"
                title="Auth Context Starter"
                icon={<StacksIcon />}
                description="Learn how to store and reuse managed context."
              />
              <SmallCard
                href="/cookbook/extensions-starter"
                title="Extensions API Starter"
                icon={<StacksIcon />}
                description="Use the Steel Extensions API to add custom extensions for your application."
              />
              <SmallCard
                href="/cookbook/files-starter"
                title="Files API Starter"
                icon={<Database />}
                description="Use the Steel Files API to manage files and directories."
              />
            </Cards>
          </div>
          <div className="flex flex-col">
            <h4
              id="explore-by-category"
              className="text-muted-foreground scroll-m-20"
            >
              <a
                href="#explore-by-category"
                className="not-prose group text-sm uppercase"
              >
                Libraries &amp; SDKs
              </a>
            </h4>
            <hr className="border-t border-border my-2" />
            <Cards>
              <SmallCard
                icon={<Js />}
                href="/steel-js-sdk"
                title="Steel JavaScript SDK"
                description="JavaScript SDK for building applications on Steel."
              />
              <SmallCard
                icon={<Js />}
                href="/steel-python-sdk"
                title="Steel Python SDK"
                description="Python SDK for building applications on Steel."
              />
            </Cards>
          </div>
          <div className="flex flex-col">
            <h4
              id="explore-by-category"
              className="text-muted-foreground scroll-m-20"
            >
              <a
                href="#explore-by-category"
                className="not-prose group text-sm uppercase"
              >
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
