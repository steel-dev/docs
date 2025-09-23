import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";

export default function PlaygroundButton({ href }: { href: string }) {
  return (
    <Link href={href}>
      <Button>
        <div className="flex items-center gap-x-2 my-0">
          <Image
            className="not-prose w-auto h-auto shrink-0"
            src="/images/UgqXSnOj7YuKyieypFDU2.png"
            alt="Playground Brick"
            width={20}
            height={10}
          />
          <p className="my-0"> Try in Playground</p>
        </div>
      </Button>
    </Link>
  );
}
