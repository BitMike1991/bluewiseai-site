// pages/platform/index.js
export default function PlatformIndex() {
  // simple client-side redirect
  if (typeof window !== "undefined") {
    window.location.href = "/platform/overview";
  }
  return null;
}
