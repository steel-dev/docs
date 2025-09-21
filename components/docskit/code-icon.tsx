import { Braces, Terminal } from 'lucide-react';
import { themeIcons } from 'seti-icons';
import { Clarity } from '@/components/ui/icon';

export function CodeIcon({
  title,
  lang,
  className,
}: {
  title: string;
  lang: string;
  className?: string;
}) {
  if (lang === 'clarity') {
    return (
      <span className={className}>
        <Clarity height="28" style={{ margin: '-8px' }} color="var(--muted-foreground)" />
      </span>
    );
  }

  if (lang === 'bash') {
    return (
      <span className={className}>
        <Terminal height="18" style={{ margin: '-8px' }} color="var(--muted-foreground)" />
      </span>
    );
  }

  if (lang === 'json') {
    return (
      <span className={className}>
        <Braces height="18" style={{ margin: '-8px' }} color="var(--muted-foreground)" />
      </span>
    );
  }

  if (lang === 'typescript') {
    return (
      <span className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-label="JavaScript"
        role="img"
        width="18" height="19"
        viewBox="0 0 21 20"
        fill="none"
      >
        <path d="M20.666 20H0.666016V0H20.666V20ZM9.6709 9.18164V15.5723C9.6709 16.512 9.28066 16.7539 8.66309 16.7539C8.01906 16.7537 7.75033 16.3105 7.45508 15.7871L5.9248 16.7129C6.36785 17.6527 7.24062 18.4316 8.74414 18.4316C10.4089 18.4316 11.5498 17.5452 11.5498 15.5986V9.18164H9.6709ZM15.8867 9.07422C14.2086 9.07426 13.1348 10.1489 13.1348 11.5586C13.1349 13.0886 14.034 13.8136 15.3896 14.3906L15.8604 14.5928C16.7192 14.9684 17.2295 15.1966 17.2295 15.8408C17.2295 16.3778 16.7328 16.7675 15.9541 16.7676C15.0279 16.7676 14.5044 16.2838 14.1016 15.626L12.5703 16.5117C13.1207 17.5992 14.2489 18.4316 15.9941 18.4316C17.7795 18.4316 19.1082 17.5059 19.1084 15.8145C19.1084 14.2438 18.209 13.5451 16.6113 12.8604L16.1416 12.6592C15.3362 12.3101 14.9873 12.0814 14.9873 11.5176C14.9875 11.0614 15.3364 10.7129 15.8867 10.7129C16.4236 10.7129 16.7725 10.9406 17.0947 11.5176L18.5586 10.5781C17.9411 9.4907 17.0816 9.07422 15.8867 9.07422Z" fill="currentColor"/>
      </svg>
      </span>
    );
  }

  if (lang === 'python') {
    return (
      <span className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
          <path d="M8.93531 18.25C4.36556 18.25 4.65075 16.2683 4.65075 16.2683L4.65637 14.2152H9.01687V13.5993H2.92331C2.92331 13.5993 0 13.9311 0 9.31975C0 4.7095 2.55206 4.87262 2.55206 4.87262H4.07531V7.01237C4.07531 7.01237 3.99319 9.56444 6.58687 9.56444H10.9114C10.9114 9.56444 13.3414 9.52506 13.3414 11.9129V15.8611C13.3414 15.8611 13.7104 18.25 8.93531 18.25ZM6.53063 16.8696C6.96431 16.8696 7.31531 16.5186 7.31531 16.0849C7.31531 15.6512 6.96431 15.3003 6.53063 15.3003C6.42754 15.3001 6.32543 15.3203 6.23016 15.3597C6.13489 15.3991 6.04833 15.4569 5.97544 15.5297C5.90254 15.6026 5.84475 15.6892 5.80537 15.7845C5.76599 15.8797 5.74579 15.9818 5.74594 16.0849C5.74594 16.5186 6.09694 16.8696 6.53063 16.8696Z" fill="currentColor"/>
          <path d="M9.06209 0.344147C13.6318 0.344147 13.3467 2.32583 13.3467 2.32583L13.341 4.37896H8.98053V4.9949H15.0735C15.0735 4.9949 17.9974 4.66302 17.9974 9.27384C17.9974 13.8846 15.4453 13.721 15.4453 13.721H13.9221V11.5818C13.9221 11.5818 14.0042 9.02971 11.4105 9.02971H7.08603C7.08603 9.02971 4.65603 9.06908 4.65603 6.68127V2.73309C4.65603 2.73309 4.28703 0.344147 9.06209 0.344147ZM11.4668 1.72452C11.3637 1.72437 11.2616 1.74457 11.1663 1.78395C11.071 1.82333 10.9845 1.88113 10.9116 1.95402C10.8387 2.02692 10.7809 2.11348 10.7415 2.20875C10.7021 2.30402 10.6819 2.40612 10.6821 2.50921C10.6821 2.94233 11.0331 3.29333 11.4668 3.29333C11.9005 3.29333 12.2515 2.9429 12.2515 2.50921C12.2515 2.07496 11.9005 1.72452 11.4668 1.72452Z" fill="currentColor"/>
        </svg>
      </span>
    );
  }

  let filename = title || 'x';
  if (!filename.includes('.')) {
    filename += '.' + lang;
  }
  const { svg, color } = getIcon(filename);
  const __html = svg.replace(
    /svg/,
    `svg fill='hsl(var(--muted-foreground))' height='28' style='margin: -8px'`,
  );
  return (
    <span className={className}>
      <span dangerouslySetInnerHTML={{ __html }} style={{ display: 'contents' }} />
    </span>
  );
}

// from https://github.com/jesseweed/seti-ui/blob/master/styles/ui-variables.less
const getIcon = themeIcons({
  white: '#d4d7d6',
  grey: '#4d5a5e',
  'grey-light': '#6d8086',
  blue: '#519aba',
  green: '#8dc149',
  orange: '#e37933',
  pink: '#f55385',
  purple: '#a074c4',
  red: '#cc3e44',
  yellow: '#cbcb41',
  ignore: '#41535b',
});
