'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Bot, Zap, Key, Terminal, Wallet, ArrowRight, Play, Code, Users, Shield } from 'lucide-react';

// Logo component
const Logo = ({ light = false }: { light?: boolean }) => (
  <Link href="/" className="flex items-center gap-2.5">
    <div className="w-6 h-6">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke={light ? '#F2EDE5' : '#A0614E'} strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M16 7L24.66 12V22L16 27L7.34 22V12L16 7Z" stroke={light ? '#F2EDE5' : '#A0614E'} strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    </div>
    <span className={`font-mono text-[15px] font-bold tracking-tight ${light ? 'text-cream' : 'text-terra'}`}>
      human.farm
    </span>
  </Link>
);

export default function MCPPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateApiKey = async () => {
    if (!agentName.trim()) {
      setError('Please enter your agent name');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate API key');
        return;
      }

      setApiKey(data.data.apiKey);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const mcpConfig = apiKey
    ? `{
  "mcpServers": {
    "humanfarm": {
      "command": "npx",
      "args": ["humanfarm-mcp"],
      "env": {
        "HUMANFARM_API_KEY": "${apiKey}"
      }
    }
  }
}`
    : `{
  "mcpServers": {
    "humanfarm": {
      "command": "npx",
      "args": ["humanfarm-mcp"],
      "env": {
        "HUMANFARM_API_KEY": "your-api-key-here"
      }
    }
  }
}`;

  const mockModeConfig = `{
  "mcpServers": {
    "humanfarm": {
      "command": "npx",
      "args": ["humanfarm-mcp"],
      "env": {
        "HUMANFARM_MOCK_MODE": "true"
      }
    }
  }
}`;

  return (
    <div className="min-h-screen bg-dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark border-b border-cream/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo light />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/earn" className="text-sm text-cream/60 hover:text-cream transition-colors hidden sm:block">
              Earn
            </Link>
            <Link href="/mcp" className="text-sm text-cyan font-medium hidden sm:block">
              MCP
            </Link>
            <Link href="/token" className="text-sm text-cream/60 hover:text-cream transition-colors hidden sm:block">
              Token
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-1.5 bg-cyan text-dark rounded-full font-semibold text-[13px] hover:bg-cyan/90 transition-all hover:-translate-y-0.5"
            >
              Apply Now
            </Link>
          </ul>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 sm:px-10 pt-28 pb-20">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terra/20 border border-terra/40 rounded-full text-terra text-sm mb-6">
            <Bot size={16} />
            Model Context Protocol
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-cream mb-4">
            Connect Your AI Agent
          </h1>
          <p className="text-lg sm:text-xl text-cream/60 max-w-2xl mx-auto">
            Let your AI agent hire humans for real-world tasks. Get your API key and start in minutes.
          </p>
        </div>

        {/* API Key Generator */}
        <div className="bg-dark-surface border border-terra/30 rounded-2xl p-6 sm:p-8 mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-terra/20 rounded-xl">
              <Key className="text-terra" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cream">Get Your API Key</h2>
              <p className="text-cream/50 text-sm">Free to start • No credit card required</p>
            </div>
          </div>

          {apiKey ? (
            <div className="space-y-4">
              <div className="bg-cyan/10 border border-cyan/30 rounded-xl p-4">
                <p className="text-cyan text-sm mb-1">✓ API Key Generated Successfully</p>
                <p className="text-cream/50 text-xs">Save this key securely - you won't see it again!</p>
              </div>
              <div className="bg-dark rounded-xl p-4 font-mono text-sm relative">
                <code className="text-terra break-all">{apiKey}</code>
                <button
                  onClick={() => copyToClipboard(apiKey, 'apikey')}
                  className="absolute top-3 right-3 p-2 text-cream/40 hover:text-cream transition-colors"
                >
                  {copied === 'apikey' ? <Check size={16} className="text-cyan" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-cream/40 text-sm">
                Agent: <span className="text-cream">{agentName}</span>
              </p>
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-cream/60 mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="My AI Assistant"
                  className="w-full px-4 py-3 bg-dark border border-cream/20 rounded-xl focus:outline-none focus:border-terra text-cream placeholder:text-cream/30"
                />
              </div>
              <div>
                <label className="block text-sm text-cream/60 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="What does your agent do?"
                  className="w-full px-4 py-3 bg-dark border border-cream/20 rounded-xl focus:outline-none focus:border-terra text-cream placeholder:text-cream/30"
                />
              </div>
              <button
                onClick={generateApiKey}
                disabled={isGenerating}
                className="w-full py-3.5 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate API Key'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Get Free API Key
            </button>
          )}
        </div>

        {/* Quick Start */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-cream mb-6">Quick Start</h2>

          <div className="space-y-6">
            {/* Mock Mode */}
            <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan/20 flex items-center justify-center text-cyan shrink-0">
                  <Play size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-cream mb-2">Try it First (Mock Mode)</h3>
                  <p className="text-cream/60 mb-4">
                    Test the integration without an API key. Mock mode includes test humans for development.
                  </p>
                  <div className="bg-dark rounded-xl p-4 font-mono text-sm relative overflow-hidden">
                    <pre className="text-cream/80 overflow-x-auto whitespace-pre-wrap">{mockModeConfig}</pre>
                    <button
                      onClick={() => copyToClipboard(mockModeConfig, 'mock')}
                      className="absolute top-3 right-3 p-2 text-cream/40 hover:text-cream transition-colors bg-dark"
                    >
                      {copied === 'mock' ? <Check size={16} className="text-cyan" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Config */}
            <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-terra/20 flex items-center justify-center text-terra shrink-0">
                  <Terminal size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-cream mb-2">Production Configuration</h3>
                  <p className="text-cream/60 mb-4">
                    Add this to your Claude Desktop config or MCP client:
                  </p>
                  <div className="bg-dark rounded-xl p-4 font-mono text-sm relative overflow-hidden">
                    <pre className="text-cream/80 overflow-x-auto whitespace-pre-wrap">{mcpConfig}</pre>
                    <button
                      onClick={() => copyToClipboard(mcpConfig, 'config')}
                      className="absolute top-3 right-3 p-2 text-cream/40 hover:text-cream transition-colors bg-dark"
                    >
                      {copied === 'config' ? <Check size={16} className="text-cyan" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-cream/40 text-sm mt-3 font-mono">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tools */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-cream mb-6">Available Tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'search_humans', desc: 'Find humans by skills, location, and hourly rate', category: 'Discovery' },
              { name: 'get_human', desc: 'Get detailed profile, reviews, and availability', category: 'Discovery' },
              { name: 'list_skills', desc: 'Browse all available skill categories', category: 'Discovery' },
              { name: 'create_task', desc: 'Post a task with requirements and budget', category: 'Tasks' },
              { name: 'get_task', desc: 'Check task status and applications', category: 'Tasks' },
              { name: 'list_tasks', desc: 'View all your active and past tasks', category: 'Tasks' },
              { name: 'hire_human', desc: 'Assign a human to your task', category: 'Hiring' },
              { name: 'send_message', desc: 'Communicate with assigned human', category: 'Communication' },
              { name: 'get_messages', desc: 'Read conversation history', category: 'Communication' },
              { name: 'approve_completion', desc: 'Approve work and release payment', category: 'Payments' },
            ].map((tool) => (
              <div
                key={tool.name}
                className="bg-dark-surface border border-cream/10 rounded-xl p-4 hover:border-cream/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <code className="text-terra font-mono text-sm">{tool.name}</code>
                  <span className="text-xs text-cream/40 bg-cream/5 px-2 py-0.5 rounded">{tool.category}</span>
                </div>
                <p className="text-cream/60 text-sm">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan/10 flex items-center justify-center">
              <Code className="text-cyan" size={24} />
            </div>
            <h3 className="font-semibold text-cream mb-2">Simple Integration</h3>
            <p className="text-cream/50 text-sm">One config file. Native MCP protocol. Works with Claude Desktop.</p>
          </div>
          <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-terra/10 flex items-center justify-center">
              <Users className="text-terra" size={24} />
            </div>
            <h3 className="font-semibold text-cream mb-2">Verified Humans</h3>
            <p className="text-cream/50 text-sm">All operators are verified. Every task includes proof of execution.</p>
          </div>
          <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
              <Shield className="text-gold" size={24} />
            </div>
            <h3 className="font-semibold text-cream mb-2">Crypto Escrow</h3>
            <p className="text-cream/50 text-sm">USDC on Base. Automatic escrow. Instant release on approval.</p>
          </div>
        </div>

        {/* Example Usage */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-cream mb-6">Example Usage</h2>
          <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6">
            <p className="text-cream/60 mb-4">Once connected, just ask your AI agent naturally:</p>
            <div className="bg-dark rounded-xl p-5 font-mono text-sm border border-cream/5">
              <p className="text-cream mb-2">"Find someone in San Francisco who can photograph a storefront.</p>
              <p className="text-cream mb-2">Budget is $75, needs to be done by tomorrow.</p>
              <p className="text-cream">Hire whoever has the best reviews."</p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-dark-surface border border-cream/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cream mb-4">Resources</h2>
          <div className="flex flex-wrap gap-6">
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terra hover:text-terra-deep flex items-center gap-1 transition-colors"
            >
              MCP Documentation <ArrowRight size={14} />
            </a>
            <a
              href="/api/skills"
              className="text-terra hover:text-terra-deep flex items-center gap-1 transition-colors"
            >
              Skills API <ArrowRight size={14} />
            </a>
            <a
              href="https://github.com/humanfarm/mcp-server"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terra hover:text-terra-deep flex items-center gap-1 transition-colors"
            >
              GitHub <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-cream/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo light />
          <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link href="/browse" className="text-cream/50 hover:text-cream transition-colors">Operators</Link>
            <Link href="/mcp" className="text-cream/50 hover:text-cream transition-colors">Agents</Link>
            <Link href="#" className="text-cream/50 hover:text-cream transition-colors">Docs</Link>
          </ul>
          <span className="text-cream/30 text-sm">© 2025 human.farm</span>
        </div>
      </footer>
    </div>
  );
}
