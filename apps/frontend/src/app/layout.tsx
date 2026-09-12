import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { constructMetadata, getOrganizationSchema, getSoftwareApplicationSchema } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  path: '',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = getOrganizationSchema();
  const softwareSchema = getSoftwareApplicationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo-icon.png" sizes="any" />
        <link rel="shortcut icon" type="image/png" href="/logo-icon.png" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        {/*
          Inline synchronous script — runs BEFORE React hydration.
          This uses a MutationObserver to catch and remove `bis_skin_checked` and similar attrs
          injected by browser extensions (e.g. Bitdefender) that cause hydration mismatches.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              // Suppress runtime errors injected by browser extensions (e.g. Urban VPN M_ID error)
              window.addEventListener('error', function(e) {
                var isExt = 
                  (e.filename && (e.filename.indexOf('chrome-extension://') !== -1 || e.filename.indexOf('moz-extension://') !== -1)) ||
                  (e.message && e.message.indexOf('M_ID') !== -1) ||
                  (e.error && e.error.stack && (e.error.stack.indexOf('chrome-extension://') !== -1 || e.error.stack.indexOf('moz-extension://') !== -1));
                if (isExt) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return true;
                }
              }, true);

              window.addEventListener('unhandledrejection', function(e) {
                var isExt = 
                  e.reason && (
                    (typeof e.reason.message === 'string' && e.reason.message.indexOf('M_ID') !== -1) ||
                    (e.reason.stack && (e.reason.stack.indexOf('chrome-extension://') !== -1 || e.reason.stack.indexOf('moz-extension://') !== -1))
                  );
                if (isExt) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);

              var b=['bis_skin_checked','bis_status','bis_frame_id','bis_register'];
              var o=Element.prototype.setAttribute;
              Element.prototype.setAttribute=function(n,v){if(b.indexOf(n)!==-1)return;o.call(this,n,v);};
              new MutationObserver(function(m){m.forEach(function(r){if(r.type==='attributes'&&b.indexOf(r.attributeName)!==-1){r.target.removeAttribute(r.attributeName);}})}).observe(document.documentElement,{attributes:true,subtree:true});
            })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <ThemeProvider>
            <CommandPalette />
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
