import { GlassCard } from '../ui';

export function AppliancePricingTable({ table, viewDetailsLabel, onViewDetails }) {
  if (!table?.rows?.length) return null;

  return (
    <div className="mb-20">
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-2">
          {table.title}
        </h2>
        {table.subtitle && (
          <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-xl mx-auto">
            {table.subtitle}
          </p>
        )}
      </div>
      <GlassCard className="p-0 border-zinc-200/50 bg-white/80 overflow-hidden shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-bold uppercase tracking-wider text-zinc-950">
                <th className="py-4 px-6">Model</th>
                <th className="py-4 px-6 text-right">Price</th>
                <th className="py-4 px-6 text-right">MRP</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/40 text-sm text-zinc-950">
              {table.rows.map((row, index) => (
                <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold">{row.model}</td>
                  <td className="py-4 px-6 text-right font-bold">{row.price}</td>
                  <td className="py-4 px-6 text-right font-medium text-zinc-400 line-through">{row.mrp}</td>
                  <td className="py-4 px-6 font-normal leading-relaxed">{row.desc}</td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetails?.(row.model)}
                      className="inline-flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs py-1.5 px-3.5 rounded-full cursor-pointer transition-all duration-300 shadow-sm"
                    >
                      {viewDetailsLabel || 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
