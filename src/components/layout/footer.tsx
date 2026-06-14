export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0A1628]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#94A3B8] text-sm">
            &copy; {new Date().getFullYear()} TripPlanner AI. Powered by Next.js, LangChain, LangGraph &amp; AMap MCP.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[#64748B] text-xs">
              基于高德 MCP 地图服务 &amp; OpenAI GPT-4o
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
