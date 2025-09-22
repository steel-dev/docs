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
                href="/sessions-api"
                variant="default"
                title="Sessions API"
                description="Explore API endpoints for managing Steel Sessions."
                tags={["API", "Sessions"]}
              />
            </Cards>
            <Cards className="xl:!grid-cols-4">
              <Card
                className="group space-y-1"
                href="/captchas-api"
                variant="default"
                title="Captchas API"
                description="Explore API endpoints for managing Steel Captchas."
                tags={["API", "Captchas"]}
              />
              <Card
                className="group space-y-1"
                href="/extensions-api"
                variant="default"
                title="Extensions API"
                description="Explore API endpoints for building on Steel."
                tags={["API", "Extensions"]}
              />
              <Card
                className="group space-y-1"
                href="/credentials-api"
                title="Credentials API"
                description="Explore API endpoints for managing Steel Credentials."
                tags={["API", "Credentials"]}
              />
              <Card
                className="group space-y-1"
                href="/resources/guides"
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
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                variant="ghost"
                title="Browser-use"
                tags={["AI agents", "Python"]}
                description="Browser-use is an open-source library that enables AI agents to control and interact with browsers programmatically."
              />
              <SmallCard
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                variant="ghost"
                title="Browser-use"
                tags={["AI agents", "Python"]}
                description="Browser-use is an open-source library that enables AI agents to control and interact with browsers programmatically."
              />
              <SmallCard
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                variant="ghost"
                title="Browser-use"
                tags={["AI agents", "Python"]}
                description="Browser-use is an open-source library that enables AI agents to control and interact with browsers programmatically."
              />
              <SmallCard
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                variant="ghost"
                title="Browser-use"
                tags={["AI agents", "Python"]}
                description="Browser-use is an open-source library that enables AI agents to control and interact with browsers programmatically."
              />
              <SmallCard
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                variant="ghost"
                title="Browser-use"
                tags={["AI agents", "Python"]}
                description="Browser-use is an open-source library that enables AI agents to control and interact with browsers programmatically."
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
                href="/reference/javascript-sdk"
                title="Steel JavaScript SDK"
                description="JavaScript SDK for building applications on Steel."
              />
              <SmallCard
                icon={<Js />}
                href="/reference/python-sdk"
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
                href="/resources/api-reference"
                title="API Reference"
                description="View the Steel API reference."
              />
              <SmallCard
                icon={<Database />}
                href="/resources/playground"
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
