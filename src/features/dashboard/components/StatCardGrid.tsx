import { BarChart3, Clock, FileText, Users } from 'lucide-react';
import React from 'react';
import StatCard from './statCards/StatCard';

const DEFAULT_STATS = [
  { icon: <FileText className="h-5 w-5" />, title: 'Beta Documents', value: '0', accentLabel: 'Start testing', subtitle: 'Upload documents to see analytics here.' },
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Beta Status', value: 'Active', accentLabel: 'Enrolled', subtitle: 'You are currently part of the beta program.' },
  { icon: <Clock className="h-5 w-5" />, title: 'Feedback Sent', value: '0', accentLabel: 'Share ideas', subtitle: 'Tell us what would make this more useful.' },
  { icon: <Users className="h-5 w-5" />, title: 'Beta Community', value: '250+', accentLabel: 'Growing', subtitle: 'Join the conversation with other early adopters.' },
] as const;

const StatCardGrid: React.FC = () => (
  <section aria-labelledby="dashboard-statistics" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
    <h2 id="dashboard-statistics" className="sr-only">
      Account statistics
    </h2>
    {DEFAULT_STATS.map((stat, index) => (
      <StatCard
        key={stat.title}
        icon={stat.icon}
        title={stat.title}
        value={stat.value}
        subtitle={stat.subtitle}
        accentLabel={stat.accentLabel}
        delay={index * 0.08}
      />
    ))}
  </section>
);

export default StatCardGrid;
