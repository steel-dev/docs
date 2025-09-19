import Link from "next/link";
import { Button } from "./ui/button";

export default function PlaygroundButton({ href }: { href: string }) {
  return (
    <Link href={href}>
      <Button>
        <img
          src="/images/UgqXSnOj7YuKyieypFDU2.png"
          alt="Playground Brick"
          width="20"
        />
        Try in Playground
      </Button>
    </Link>
  );
}
