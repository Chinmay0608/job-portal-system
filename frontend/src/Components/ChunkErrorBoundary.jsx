import React from "react";

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.message?.includes("dynamically imported module") ||
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("Loading chunk") ||
      error?.name === "ChunkLoadError";

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error) {
    console.warn("[ChunkErrorBoundary] Caught chunk loading error:", error?.message);

    const isChunkError =
      error?.message?.includes("dynamically imported module") ||
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("Loading chunk") ||
      error?.name === "ChunkLoadError";

    if (isChunkError) {
      const lastReload = sessionStorage.getItem("chunk_reload_timestamp");
      const now = Date.now();
      // Auto-reload on stale chunk once if not reloaded within the last 15 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem("chunk_reload_timestamp", now.toString());
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900">
          <div className="max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">New Version Available</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              A fresh update has been deployed. Please reload the page to load the latest features.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
