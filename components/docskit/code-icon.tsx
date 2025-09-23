import { Braces } from "lucide-react";
import { themeIcons } from "seti-icons";
import { PythonIcon, TSIcon, BashIcon } from "../ui/icon";

export function CodeIcon({
  title,
  lang,
  className,
}: {
  title: string;
  lang: string;
  className?: string;
}) {
  if (lang === "bash") {
    return (
      <span className={className}>
        <BashIcon height="18" color="var(--muted-foreground)" />
      </span>
    );
  }

  if (lang === "json") {
    return (
      <span className={className}>
        <Braces
          height="18"
          style={{ margin: "-8px" }}
          color="var(--muted-foreground)"
        />
      </span>
    );
  }

  if (lang === "typescript") {
    return <TSIcon height="18" color="var(--muted-foreground)" />;
  }

  if (lang === "python") {
    return <PythonIcon height="18" color="var(--muted-foreground)" />;
  }

  let filename = title || "x";
  if (!filename.includes(".")) {
    filename += "." + lang;
  }
  const { svg, color } = getIcon(filename);
  const __html = svg.replace(
    /svg/,
    `svg fill='hsl(var(--muted-foreground))' height='28' style='margin: -8px'`,
  );
  return (
    <span className={className}>
      <span
        dangerouslySetInnerHTML={{ __html }}
        style={{ display: "contents" }}
      />
    </span>
  );
}

// from https://github.com/jesseweed/seti-ui/blob/master/styles/ui-variables.less
const getIcon = themeIcons({
  white: "#d4d7d6",
  grey: "#4d5a5e",
  "grey-light": "#6d8086",
  blue: "#519aba",
  green: "#8dc149",
  orange: "#e37933",
  pink: "#f55385",
  purple: "#a074c4",
  red: "#cc3e44",
  yellow: "#cbcb41",
  ignore: "#41535b",
});
