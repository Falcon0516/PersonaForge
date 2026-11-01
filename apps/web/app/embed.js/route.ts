import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botSlug = searchParams.get("bot") || "default";
  const origin = req.nextUrl.origin;

  const script = `
(function() {
  if (window.__PF_EMBED_INITIALIZED__) return;
  window.__PF_EMBED_INITIALIZED__ = true;

  const botSlug = "${botSlug}";
  const host = "${origin}";

  // Create launcher button
  const launcher = document.createElement("button");
  launcher.id = "pf-launcher-btn";
  launcher.innerHTML = \`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  \`;
  launcher.style.cssText = \`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: #6366f1;
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999998;
    transition: transform 0.2s, background 0.2s;
  \`;

  launcher.onmouseenter = () => launcher.style.transform = "scale(1.08)";
  launcher.onmouseleave = () => launcher.style.transform = "scale(1)";

  // Create iframe container
  const iframeContainer = document.createElement("div");
  iframeContainer.id = "pf-iframe-container";
  iframeContainer.style.cssText = \`
    position: fixed;
    bottom: 96px;
    right: 24px;
    width: 400px;
    height: 640px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 120px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
    z-index: 999999;
    display: none;
    border: 1px solid rgba(51, 65, 85, 0.6);
  \`;

  const iframe = document.createElement("iframe");
  iframe.src = host + "/b/" + botSlug + "?embedded=true";
  iframe.style.cssText = "width: 100%; height: 100%; border: none; background: #090d16;";
  iframe.title = "PersonaForge AI Assistant";
  iframeContainer.appendChild(iframe);

  let isOpen = false;
  launcher.onclick = () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframeContainer.style.display = "block";
      launcher.innerHTML = \`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      \`;
    } else {
      iframeContainer.style.display = "none";
      launcher.innerHTML = \`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      \`;
    }
  };

  document.body.appendChild(iframeContainer);
  document.body.appendChild(launcher);
})();
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
