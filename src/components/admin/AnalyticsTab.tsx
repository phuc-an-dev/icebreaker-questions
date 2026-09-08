'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Sparkles,
  Layers,
  Tag,
  MessageSquareQuote,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Clock,
  HelpCircle,
  Award,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { hapticFeedback } from '@/lib/haptics';
import { IconHelper } from '@/components/ui/IconHelper';
import { AdminStatsOverview } from '@/types/stats';

interface AnalyticsTabProps {
  // Navigation callback to switch to Questions tab with specific filters pre-applied
  onNavigateToFilter?: (options: {
    tab?: 'questions';
    category?: string;
    type?: string;
    filter?: string;
  }) => void;
  // Callback to synchronize total count with parent header & tab badge
  onTotalUpdated?: (total: number) => void;
}

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 650,
}) => {
  const displayValue = useCountUp(value, duration);
  return <span>{displayValue.toLocaleString()}</span>;
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  onNavigateToFilter,
  onTotalUpdated,
}) => {
  const [stats, setStats] = useState<AdminStatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // [UI/UX IMPROVEMENT 4]: Mobile-friendly expandable formats (default Top 5, toggle full list)
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    hapticFeedback.light();
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch('/api/admin/stats/overview')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load stats: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: AdminStatsOverview) => {
        if (!ignore) {
          setStats(data);
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);
          hapticFeedback.success();

          // [BUG FIX 1]: Synchronize total questions count with parent header & tabs
          if (data.kpis?.totalQuestions !== undefined && onTotalUpdated) {
            onTotalUpdated(data.kpis.totalQuestions);
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error('Error fetching analytics stats:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
          setIsRefreshing(false);
          hapticFeedback.warning();
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, onTotalUpdated]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-14 bg-surface-card rounded-2xl border border-edge" />
        <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-card rounded-2xl border border-edge" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="h-72 bg-surface-card rounded-2xl border border-edge" />
          <div className="h-72 bg-surface-card rounded-2xl border border-edge" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="h-60 bg-surface-card rounded-2xl border border-edge" />
          <div className="h-60 bg-surface-card rounded-2xl border border-edge" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-red-500/30 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-semibold text-content">Failed to load statistics</h3>
        <p className="text-xs text-content-muted">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { kpis, categoryDistribution, typeDistribution, dataHealth, contributors } = stats;

  // [UI/UX IMPROVEMENT 4]: Limit visible formats on mobile, expandable via button
  const visibleFormats = isFormatExpanded ? typeDistribution : typeDistribution.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Refresh Control (Mobile-first responsive toolbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card/70 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-edge">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-content truncate">
              Content Analytics &amp; Health
            </h2>
            <p className="text-[11px] sm:text-xs text-content-muted truncate">
              Real-time balance, quality linting, and contributor metrics
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-edge/60 sm:border-0">
          {lastUpdated && (
            <span className="text-[11px] text-content-muted flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 shrink-0" />
              <span>Sync {lastUpdated}</span>
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-card text-content border border-edge transition active:scale-95 disabled:opacity-50 min-h-[38px] sm:min-h-[36px]"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* [MOBILE-FIRST LAYOUT 2]: 5 KPI Cards 
          - Mobile (< 375px): 1 column
          - Mobile (>= 375px): 2 columns
          - Desktop: 3 to 5 columns
          - Actionable "Untagged Alert" prioritized to the top on mobile (order-first)
      */}
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* [INTERACTION 9 & VISUAL POLISH 13]: Tappable Untagged Alert Card with Segmented Progress Bar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (onNavigateToFilter && kpis.untaggedCount > 0) {
              hapticFeedback.medium();
              onNavigateToFilter({ tab: 'questions', filter: 'untagged' });
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onNavigateToFilter && kpis.untaggedCount > 0) {
              hapticFeedback.medium();
              onNavigateToFilter({ tab: 'questions', filter: 'untagged' });
            }
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition group min-h-[110px] sm:min-h-[120px] select-none ${
            kpis.untaggedCount > 0
              ? 'order-first xl:order-3 bg-amber-500/5 border-amber-500/40 hover:border-amber-500 cursor-pointer shadow-sm shadow-amber-500/5 active:scale-[0.99]'
              : 'bg-surface-card border-edge hover:border-emerald-500/40'
          }`}
          title={kpis.untaggedCount > 0 ? 'Click to filter and view untagged questions' : 'All questions are tagged'}
        >
          <div>
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">
                Untagged Alert
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  kpis.untaggedCount > 0
                    ? 'bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
                <AnimatedNumber value={kpis.untaggedCount} />
              </span>
              {kpis.untaggedCount > 0 && (
                <span className="text-xs font-bold text-amber-400">
                  ({kpis.untaggedPercentage}%)
                </span>
              )}
            </div>
          </div>

          <div className="mt-2.5">
            {/* [VISUAL POLISH 13]: Dual-segmented progress bar matching Content Provenance style */}
            <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden flex border border-edge/60">
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${Math.max(kpis.untaggedPercentage, 3)}%` }}
                title={`Untagged: ${kpis.untaggedCount} (${kpis.untaggedPercentage}%)`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${100 - kpis.untaggedPercentage}%` }}
                title={`Tagged: ${kpis.totalQuestions - kpis.untaggedCount}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] mt-1.5">
              <span className={kpis.untaggedCount > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {kpis.untaggedCount > 0 ? 'Needs tag labeling' : '100% tagged'}
              </span>
              {kpis.untaggedCount > 0 && (
                <span className="text-amber-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Filter</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Questions Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-edge flex flex-col justify-between hover:border-blue-500/40 transition min-h-[110px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">
                Total Questions
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              <AnimatedNumber value={kpis.totalQuestions} />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-content-muted mt-2 flex items-center gap-1 truncate">
            <Database className="w-3 h-3 text-blue-400 shrink-0" />
            <span>100% Atlas indexed</span>
          </p>
        </div>

        {/* Active Themes Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-edge flex flex-col justify-between hover:border-purple-500/40 transition min-h-[110px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">
                Active Themes
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              <AnimatedNumber value={kpis.activeCategoriesCount} />
              <span className="text-xs font-normal text-content-muted ml-1">/ {kpis.totalCategoriesCount}</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-content-muted mt-2 truncate">
            {dataHealth.orphanCategories.length === 0 ? (
              <span className="text-emerald-400 font-medium">All categories populated</span>
            ) : (
              <span className="text-amber-400 font-medium">{dataHealth.orphanCategories.length} empty category</span>
            )}
          </p>
        </div>

        {/* Interaction Styles Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-edge flex flex-col justify-between hover:border-cyan-500/40 transition min-h-[110px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">
                Interaction Styles
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <MessageSquareQuote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              <AnimatedNumber value={kpis.activeTypesCount} />
              <span className="text-xs font-normal text-content-muted ml-1">/ {kpis.totalTypesCount}</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-content-muted mt-2 truncate">
            Question formats in use
          </p>
        </div>

        {/* Human Contributions Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-edge flex flex-col justify-between hover:border-emerald-500/40 transition min-h-[110px] sm:min-h-[120px] min-[375px]:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">
                Human Contributions
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              <AnimatedNumber value={kpis.humanCreatedCount} />
              <span className="text-xs font-normal text-emerald-400 ml-1">({kpis.humanPercentage}%)</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-content-muted mt-2 truncate">
            {kpis.seedCreatedCount} System Seed
          </p>
        </div>
      </div>

      {/* [MOBILE-FIRST LAYOUT 3]: 2 Distribution Charts (1 column mobile, 2 columns desktop, no internal scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Category Balance Block */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-surface-card border border-edge space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-content truncate">Category Balance</h3>
                <p className="text-[11px] text-content-muted truncate">Distribution of questions across themes</p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-elevated text-content-muted border border-edge shrink-0">
              {categoryDistribution.length} Themes
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {categoryDistribution.map((cat) => {
              const isUnderrepresented = cat.percentage < 5 && cat.count > 0;
              const isEmpty = cat.count === 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (onNavigateToFilter && cat.count > 0) {
                      hapticFeedback.light();
                      onNavigateToFilter({ tab: 'questions', category: cat.id });
                    }
                  }}
                  className={`space-y-1.5 p-2 rounded-xl transition ${
                    cat.count > 0
                      ? 'hover:bg-surface-elevated/70 cursor-pointer active:scale-[0.99]'
                      : 'opacity-60'
                  }`}
                  title={cat.count > 0 ? `Filter questions by "${cat.label}"` : 'No questions in this category'}
                >
                  {/* [MOBILE-FIRST 6]: Prevent awkward text wrapping on narrow screens */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-content truncate">{cat.label}</span>
                      {isEmpty && (
                        <span className="text-[10px] px-1.5 py-0.2 font-semibold bg-red-500/20 text-red-300 border border-red-500/30 rounded shrink-0">
                          Empty
                        </span>
                      )}
                      {isUnderrepresented && (
                        <span className="text-[10px] px-1.5 py-0.2 font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded shrink-0">
                          Low (&lt;5%)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-content">{cat.count}</span>
                      <span className="text-content-muted text-[11px] w-9 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-edge/60">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(cat.percentage, cat.count > 0 ? 2 : 0)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* [MOBILE-FIRST LAYOUT 4]: Format Diversity Block (No nested scroll, Top 5 + Show More) */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-surface-card border border-edge space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-content truncate">Format Diversity</h3>
                <p className="text-[11px] text-content-muted truncate">Distribution of interaction styles</p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-elevated text-content-muted border border-edge shrink-0">
              {typeDistribution.length} Formats
            </span>
          </div>

          {/* No internal scrollbar! List expands smoothly with toggle */}
          <div className="space-y-3 pt-1">
            {visibleFormats.map((type) => {
              const isEmpty = type.count === 0;

              return (
                <div
                  key={type.id}
                  onClick={() => {
                    if (onNavigateToFilter && type.count > 0) {
                      hapticFeedback.light();
                      onNavigateToFilter({ tab: 'questions', type: type.id });
                    }
                  }}
                  className={`space-y-1.5 p-2 rounded-xl transition ${
                    type.count > 0
                      ? 'hover:bg-surface-elevated/70 cursor-pointer active:scale-[0.99]'
                      : 'opacity-60'
                  }`}
                  title={type.count > 0 ? `Filter questions by "${type.label}"` : 'No questions in this format'}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 text-cyan-400 shrink-0 flex items-center justify-center">
                        <IconHelper name={type.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-content truncate">{type.label}</span>
                      {isEmpty && (
                        <span className="text-[10px] px-1.5 py-0.2 font-semibold bg-red-500/20 text-red-300 border border-red-500/30 rounded shrink-0">
                          Empty
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-content">{type.count}</span>
                      <span className="text-content-muted text-[11px] w-9 text-right">
                        {type.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-edge/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(type.percentage, type.count > 0 ? 2 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* [UI/UX IMPROVEMENT 4]: Show more toggle button for mobile and compact desktop viewing */}
          {typeDistribution.length > 5 && (
            <button
              onClick={() => {
                setIsFormatExpanded((prev) => !prev);
                hapticFeedback.light();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-surface-elevated hover:bg-surface-card border border-edge text-content flex items-center justify-center gap-2 transition active:scale-[0.99] min-h-[44px]"
            >
              <span>
                {isFormatExpanded
                  ? 'Show less'
                  : `Show all ${typeDistribution.length} formats (+${typeDistribution.length - 5} more)`}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isFormatExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* [MOBILE-FIRST LAYOUT 3 & 5]: Data Health & Author Contributions 
          - Mobile: 1 column
          - Desktop: 2 columns
          - Elimination of dead whitespace in Data Health
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* [UI/UX IMPROVEMENT 5]: Data Health & Linting (Clean Reordered Flow: Length Stats -> Top Tags -> Alerts) */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-surface-card border border-edge space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-content truncate">Data Health &amp; Linting</h3>
              <p className="text-[11px] text-content-muted truncate">Content quality, lengths, and orphan entities</p>
            </div>
          </div>

          {/* Section 1: Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-surface-elevated border border-edge text-center sm:text-left">
              <p className="text-[10px] uppercase font-semibold text-content-muted">Avg Length</p>
              <p className="text-sm sm:text-base font-bold text-content mt-0.5">
                {dataHealth.averageTextLength}{' '}
                <span className="text-[10px] font-normal text-content-muted">chars</span>
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-surface-elevated border border-edge text-center sm:text-left">
              <p className="text-[10px] uppercase font-semibold text-content-muted">Shortest</p>
              <p className="text-sm sm:text-base font-bold text-content mt-0.5">
                {dataHealth.minTextLength}{' '}
                <span className="text-[10px] font-normal text-content-muted">chars</span>
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-surface-elevated border border-edge text-center sm:text-left">
              <p className="text-[10px] uppercase font-semibold text-content-muted">Longest</p>
              <p className="text-sm sm:text-base font-bold text-content mt-0.5">
                {dataHealth.maxTextLength}{' '}
                <span className="text-[10px] font-normal text-content-muted">chars</span>
              </p>
            </div>
          </div>

          {/* Section 2: Top Tags Cloud (Placed directly under stats without empty gap) */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold text-content-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              Top Tags Frequency
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dataHealth.topTags.length > 0 ? (
                dataHealth.topTags.map((item) => (
                  <span
                    key={item.tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-surface-elevated border border-edge text-content-muted hover:text-content transition"
                  >
                    <span>#{item.tag}</span>
                    <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-blue-500/20 text-blue-300">
                      {item.count}
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-content-muted">No tags recorded yet</span>
              )}
            </div>
          </div>

          {/* Section 3: Alerts at the bottom */}
          <div className="space-y-2.5 pt-1">
            {/* [INTERACTION 10]: Clickable Long Questions Warning */}
            {dataHealth.longQuestionsCount > 0 ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToFilter) {
                    hapticFeedback.medium();
                    onNavigateToFilter({ tab: 'questions', filter: 'long' });
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onNavigateToFilter) {
                    hapticFeedback.medium();
                    onNavigateToFilter({ tab: 'questions', filter: 'long' });
                  }
                }}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 text-xs text-amber-300 hover:border-amber-500/60 transition cursor-pointer min-h-[44px] group"
                title="Click to view all questions exceeding 160 characters"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="truncate">
                    <strong>{dataHealth.longQuestionsCount}</strong> questions exceed 160 chars (may wrap on Stage View).
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>All questions fit within comfortable presentation length (&le; 160 chars).</span>
              </div>
            )}

            {/* Orphan Entities Status */}
            {dataHealth.orphanCategories.length > 0 || dataHealth.orphanTypes.length > 0 ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="min-w-0">
                  {dataHealth.orphanCategories.length > 0 && (
                    <p className="truncate">
                      Unused Categories: <strong>{dataHealth.orphanCategories.map((c) => c.label).join(', ')}</strong>
                    </p>
                  )}
                  {dataHealth.orphanTypes.length > 0 && (
                    <p className="truncate">
                      Unused Formats: <strong>{dataHealth.orphanTypes.map((t) => t.label).join(', ')}</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Zero orphan categories or formats found. All entities actively utilized.</span>
              </div>
            )}
          </div>
        </div>

        {/* [MOBILE-FIRST LAYOUT 6]: Contributor Network & Provenance (Robust responsive wrapping) */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-surface-card border border-edge space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-content truncate">Author Contributions</h3>
              <p className="text-[11px] text-content-muted truncate">Provenance and admin team activity</p>
            </div>
          </div>

          {/* Provenance Dual Bar */}
          <div className="space-y-2 p-3.5 rounded-xl bg-surface-elevated border border-edge">
            <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-content">Content Provenance</span>
              <span className="text-content-muted text-[11px]">
                {contributors.humanCount} Human ({contributors.humanPercentage}%) &bull; {contributors.seedCount} Seed
              </span>
            </div>
            <div className="h-2.5 w-full bg-surface rounded-full overflow-hidden flex border border-edge/60">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${contributors.humanPercentage}%` }}
                title={`Admin Contributions: ${contributors.humanCount} (${contributors.humanPercentage}%)`}
              />
              <div
                className="h-full bg-blue-600 transition-all duration-700"
                style={{ width: `${100 - contributors.humanPercentage}%` }}
                title={`System Seed: ${contributors.seedCount}`}
              />
            </div>
            <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1 text-[11px] text-content-muted pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Admin Created ({contributors.humanCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                System Default ({contributors.seedCount})
              </span>
            </div>
          </div>

          {/* [MOBILE-FIRST 6]: Top 3 Contributing Admins with Graceful Multi-line Wrapping on Small Screens */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold text-content-muted flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Top Contributing Admins
            </p>

            {contributors.topAuthors.length > 0 ? (
              <div className="space-y-2">
                {contributors.topAuthors.map((author, index) => (
                  <div
                    key={author.id}
                    className="p-3 rounded-xl bg-surface-elevated/70 border border-edge flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          index === 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : index === 1
                            ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-content truncate">{author.name}</p>
                        <p className="text-[10px] text-content-muted">{author.percentage}% of all questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end min-[380px]:self-auto shrink-0 pl-8 min-[380px]:pl-0">
                      <span className="font-bold text-content text-sm">{author.count}</span>
                      <span className="text-[11px] text-content-muted">questions</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-elevated/50 border border-edge text-center text-xs text-content-muted">
                All current questions originate from the initial system seed.
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-content-muted flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Author attribution is tracked automatically when questions are authored or imported into MongoDB.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
