import { Brackets, Database } from 'lucide-react';
import { Cards, IndexCard } from '@/components/card';
import { FileIcon, KeyIcon } from '@/components/ui/icon';

export default function ToolsPage() {
  return (
    <main className="my-6 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)]">
        <div className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-3xl">Cookbook</h3>
            <hr className="border-t border-border mt-8" />
          </div>
          <Cards>
            <IndexCard
              href="/cookbook/credentials-starter"
              title="Credentials API Starter"
              icon={<KeyIcon />}
              description="Use the Steel Credentials API to securely store and manage user credentials."
            />
            <IndexCard
              href="/cookbook/auth-context-starter"
              title="Auth Context Starter"
              icon={<Database />}
              description="Learn how to store and reuse managed context."
            />
            <IndexCard
              href="/cookbook/extensions-starter"
              title="Extensions API Starter"
              icon={<Brackets />}
              description="Use the Steel Extensions API to add custom extensions for your application."
            />
            <IndexCard
              href="/cookbook/files-starter"
              title="Files API Starter"
              icon={<FileIcon />}
              description="Use the Steel Files API to manage files and directories."
            />
          </Cards>
        </div>
      </div>
    </main>
  );
}
