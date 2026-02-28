"use client";

import { MessageCircle } from "lucide-react";

export default function ChatbotPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">AI Chatbot</h1>
        <p className="text-theme-muted">Ask questions about your land and get answers from your data</p>
      </div>

      <div className="bg-theme-card border border-theme rounded-2xl p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-theme mb-2">Land Data Assistant</h3>
        <p className="text-theme-muted max-w-md mx-auto mb-6">
          Click the green chat bubble in the bottom-right corner to open the AI assistant. You can ask:
        </p>
        <ul className="text-left max-w-sm mx-auto space-y-2 text-theme-muted">
          <li>• &quot;What is my total land area?&quot;</li>
          <li>• &quot;Show profit from Field X&quot;</li>
          <li>• &quot;How much Thaka income?&quot;</li>
          <li>• &quot;Cultivated area?&quot;</li>
          <li>• &quot;Water records?&quot;</li>
          <li>• &quot;Unused land?&quot;</li>
        </ul>
        <p className="text-sm text-theme-muted mt-6">The chatbot analyzes your stored data and responds in real time.</p>
      </div>
    </div>
  );
}
