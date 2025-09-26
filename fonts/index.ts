import localFont from 'next/font/local';

export const jetBrainsMono = localFont({
  src: [
    {
      path: './JetBrainsMono/JetBrainsMono-Regular.woff2',
      weight: 'normal',
      style: 'normal',
    },
    {
      path: './JetBrainsMono/JetBrainsMono-Regular.woff2',
      weight: 'normal',
      style: 'normal',
    },
    {
      path: './JetBrainsMono/JetBrainsMono-Medium.woff2',
      weight: 'bold',
      style: 'normal',
    },
    {
      path: './JetBrainsMono/JetBrainsMono-Medium.woff2',
      weight: 'bold',
      style: 'normal',
    },
  ],
  display: 'optional',
  variable: '--font-mono',
});

export const inter = localFont({
  src: [
    {
      path: './Inter-Regular.woff2',
      weight: 'normal',
      style: 'normal',
    },
    {
      path: './Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'optional',
  variable: '--font-inter',
});
