import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

export const CATEGORY_COLORS = { PLASTIC: '#16A34A', PAPER: '#0EA5E9', GLASS: '#8B5CF6', METAL: '#F59E0B' };

const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
};

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,.08)', fontSize: 13 };

export function TrendChart({ data, dataKey = 'verifiedKg', name = 'Verified kg', height = 260 }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradEco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16A34A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#16A34A" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke="#16A34A" strokeWidth={2.5} fill="url(#gradEco)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data, height = 260 }) {
  const rows = data.filter((d) => d.verifiedKg > 0).map((d) => ({ name: d.category.charAt(0) + d.category.slice(1).toLowerCase(), key: d.category, value: d.verifiedKg }));
  if (rows.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
          {rows.map((r) => <Cell key={r.key} fill={CATEGORY_COLORS[r.key]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} kg`} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, xKey, bars, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[6, 6, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export { monthLabel };
