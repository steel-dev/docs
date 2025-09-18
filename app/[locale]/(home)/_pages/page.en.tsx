import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Braces, Database, Play } from "lucide-react";
import { Card, Cards, SmallCard } from "@/components/card";
import { API, Js, StacksIcon } from "@/components/ui/icon";
import SteelLogo from "@/public/images/6-qmg3uQon_NBbndvw340.png";
import heroImage from "@/public/stacks-hero.svg";

export default function HomePage() {
  return (
    <main className="my-2 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)] py-20">
        <div className="space-y-10">
          <div className="space-y-1">
            <div className="flex space-x-6 items-end">
              <ImageZoom
                alt="banner"
                src={SteelLogo}
                width={100}
                height={100}
                className="mt-0 mb-6 first-line:rounded-md bg-background"
                priority
              />

              <div className="flex flex-col [&_p]:mb-6 space-y-3">
                <h3 className="text-3xl">Welcome to Steel Docs</h3>
                <p>
                  Find all the guides and resources you need to build on the
                  Steel API.
                </p>
              </div>
            </div>
          </div>
          <Cards>
            <Card
              className="group space-y-1"
              icon={
                <API className="transition-colors duration-500 ease-in-out group-hover:text-primary" />
              }
              href="/apis/sessions-api"
              title="Sessions API Reference"
              description="Explore API endpoints for managing Steel Sessions."
            />
            <Card
              className="group space-y-1"
              icon={
                <Play className="transition-colors duration-500 ease-in-out group-hover:text-primary" />
              }
              href="/resources/guides"
              title="Guides"
              description="Explore guides for building on Steel."
            />
          </Cards>
          <div className="flex flex-col">
            <h4
              id="explore-by-category"
              className="text-muted-foreground scroll-m-20"
            >
              <a
                href="#explore-by-category"
                className="not-prose group text-sm uppercase"
              >
                APIs
              </a>
            </h4>
            <hr className="border-t border-border my-2" />
            <Cards>
              <SmallCard
                icon={<StacksIcon />}
                href="/apis/sessions-api"
                title="Sessions API"
                description="Comprehensive REST API for interacting with the Sessions API."
              />
              <SmallCard
                icon={<API />}
                href="/apis/captchas-api"
                title="Captchas API"
                description="Solve CAPTCHA challenges and check their status."
              />
              <SmallCard
                icon={<API />}
                href="/apis/files-api"
                title="Files API"
                description="Programmatically manage files and storage via REST interface."
              />
              <SmallCard
                icon={<API />}
                href="/apis/credentials-api"
                title="Credentials API"
                description="Manage and verify credentials using the Credentials API."
              />
              <SmallCard
                icon={<API />}
                href="/apis/extensions-api"
                title="Extensions API"
                description="Load custom extensions and plugins for your application."
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
