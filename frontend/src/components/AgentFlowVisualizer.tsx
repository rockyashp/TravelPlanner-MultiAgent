import type { AgentPipelineProgress } from '../types/travel';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

interface Props {
  progress: AgentPipelineProgress;
  isLoading: boolean;
}

const AGENTS = [
  { id: 'intent_agent',   label: 'Intent & Profile',   icon: '🧠', desc: 'Origins, dates & INR budget' },
  { id: 'attractions',    label: 'Attractions & Wiki', icon: '🏛️', desc: 'OSM sights & entry fees' },
  { id: 'culinary',       label: 'Food & Specialties', icon: '🍛', desc: 'Dining & regional dishes' },
  { id: 'weather',        label: '7-Day Forecast',     icon: '🌤️', desc: 'Open-Meteo & rain plans' },
  { id: 'transit',        label: 'Flight/Train/Bus/Cab',icon: '🚆', desc: 'Intercity fares & commute' },
  { id: 'budget_safety',  label: 'Budget (₹) & Safety', icon: '🛡️', desc: 'INR costs & packing list' },
  { id: 'synthesizer',    label: 'Master Synthesizer', icon: '✨', desc: 'Geo-clustered plan & map' },
] as const;

type AgentId = typeof AGENTS[number]['id'];

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'started' || status === 'running') return <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-rose-500" />;
  return <Clock className="w-4 h-4 text-slate-300" />;
}

export function AgentFlowVisualizer({ progress, isLoading }: Props) {
  const hasActivity = isLoading || Object.values(progress).some((s) => s !== 'idle');
  if (!hasActivity) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-6 animate-fade-in">
      <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping" />
            <h3 className="text-sm font-extrabold text-slate-900">
              LangGraph Multi-Agent Architecture
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white/60">
            7 Specialized Agents Orchestrated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {AGENTS.map((agent, idx) => {
            const status = progress[agent.id as AgentId] ?? 'idle';
            const isActive = status === 'started' || status === 'running';
            const isDone = status === 'completed';
            const isErr = status === 'error';

            return (
              <div
                key={agent.id}
                className={`
                  relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-300
                  ${isDone ? 'bg-emerald-50/70 border-emerald-200 shadow-sm' : ''}
                  ${isActive ? 'bg-violet-50/80 border-violet-300 shadow-md ring-2 ring-violet-400/30 scale-105' : ''}
                  ${isErr ? 'bg-rose-50/70 border-rose-200' : ''}
                  ${!isDone && !isActive && !isErr ? 'bg-white/30 border-white/40' : ''}
                `}
              >
                {/* Connector line for desktop */}
                {idx < AGENTS.length - 1 && (
                  <div
                    className={`
                    hidden lg:block absolute top-1/2 -right-2 w-3.5 h-0.5 -translate-y-1/2 z-10
                    ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}
                  `}
                  />
                )}

                <div className={`text-xl mb-1.5 transition-transform ${isActive ? 'scale-125' : ''}`}>
                  {agent.icon}
                </div>
                <StatusIcon status={status} />
                <p
                  className={`
                  text-[11px] font-bold mt-1 leading-tight
                  ${isDone ? 'text-emerald-800' : isActive ? 'text-violet-800' : isErr ? 'text-rose-600' : 'text-slate-600'}
                `}
                >
                  {agent.label}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight hidden sm:block">
                  {agent.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
