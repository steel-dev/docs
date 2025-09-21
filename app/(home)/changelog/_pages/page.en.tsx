import { Code, Database, Terminal } from "lucide-react";
import { Cards, IndexCard } from "@/components/card";
import { Clarity } from "@/components/ui/icon";

export default function ResourcesPage() {
  return (
    <main className="my-6 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)]">
        <div className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-3xl">Resources</h3>
            <hr className="border-t border-border mt-8" />
          </div>
          <Cards>
            <IndexCard
              icon={<Code />}
              href="/resources/api-reference"
              title="API Reference"
              description="API reference for viewing the Steel API."
            />
            <IndexCard
              icon={<Database />}
              href="/resources/playground"
              title="Playground"
              description="Explore the examples and quick-start guides in Steel playground."
            />
          </Cards>
        </div>
      </div>
    </main>
  );
}
