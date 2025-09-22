import { Brackets, Database } from "lucide-react";
import { Cards, IndexCard } from "@/components/card";
import { Chainhook, Clarinet } from "@/components/ui/icon";

export default function ToolsPage() {
  return (
    <main className="my-6 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)]">
        <div className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-3xl">Tools</h3>
            <hr className="border-t border-border mt-8" />
          </div>
          <Cards>
            <IndexCard
              href="/examples/steel-browser-use-starter"
              title="Browser-use Starter"
              icon={<Database />}
              description="Use Browser-use to interact with the Steel API."
            />
            <IndexCard
              href="/examples/steel-credentials-starter"
              title="Credentials Starter"
              icon={<Clarinet />}
              description="Use the Steel Credentials API to securely store and manage user credentials."
            />
            <IndexCard
              href="/examples/steel-auth-context-starter"
              title="Auth Context Starter"
              icon={<Chainhook />}
              description="Learn how to store and reuse managed context."
            />
            <IndexCard
              href="/examples/steel-extensions-starter"
              title="Extensions Starter"
              icon={<Brackets />}
              description="Use the Steel Extensions API to add custom extensions for your application."
            />
            <IndexCard
              href="/examples/steel-files-api-starter"
              title="Files API Starter"
              icon={<Database />}
              description="Use the Steel Files API to manage files and directories."
            />
          </Cards>
        </div>
      </div>
    </main>
  );
}
