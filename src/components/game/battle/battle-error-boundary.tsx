"use client"

import { Component, type ReactNode } from "react"

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export default class BattleErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[BattleErrorBoundary]", error.message, info.componentStack?.slice(0, 200))
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <span className="text-3xl">⚡</span>
          </div>
          <h2 className="text-lg font-black text-red-400">Arena Malfunction</h2>
          <p className="text-sm text-white/40 text-center max-w-md">
            The battle engine crashed. This is usually recoverable.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-[#FFCC00] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#FFD940] transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
