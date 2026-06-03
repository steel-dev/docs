'use client';

import Script from 'next/script';

export function ReoAnalytics() {
  const clientID = process.env.NEXT_PUBLIC_REO_CLIENT_ID;

  if (!clientID) {
    return null;
  }

  return (
    <Script id="reo-init" strategy="afterInteractive">
      {`!function(){var e,t,n;e="${clientID}",t=function(){Reo.init({clientID:"${clientID}", enableThirdPartyTracking:true})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();`}
    </Script>
  );
}
