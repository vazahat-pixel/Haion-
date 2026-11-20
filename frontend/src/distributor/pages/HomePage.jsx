import { useState } from 'react';
import { Tag, ShoppingCart, ShoppingBag, Briefcase, Boxes, Scale } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useDmsQuery, useLookups, fmt } from '../api';
import { locOpt } from '../components/ui';

const COLORS = ['#337ab7', '#5cb85c', '#f0ad4e', '#d9534f', '#5bc0de', '#777'];

function Tile({ bg, icon: Icon, label, amount, qty, dark }) {
  return (
    <div className="dms-tile" style={{ background: bg, color: dark ? '#fff' : '#fff' }}>
      {amount !== undefined && <div className="v">₹ {fmt.money(amount)}</div>}
      {qty !== undefined && <div className="v">{qty} Pcs</div>}
      <Icon />
      <div className="lbl">{label}</div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return <div className="dms-chart"><h4>{title}</h4><ResponsiveContainer width="100%" height={260}>{children}</ResponsiveContainer></div>;
}

export default function HomePage() {
  const [txn, setTxn] = useState('both');
  const [location, setLocation] = useState('');
  const [applied, setApplied] = useState({ txn: 'both', location: '' });
  const [chart, setChart] = useState('Plain');
  const { data: lk } = useLookups();
  const { data, isLoading } = useDmsQuery('dash', '/reports/dashboard', { txn: applied.txn, ...(applied.location ? { location: applied.location } : {}) });
  const d = data?.data;
  const t = d?.tiles;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '10px 0 4px' }}>
        <select aria-label="Transaction type" style={{ width: 200 }} value={txn} onChange={(e) => setTxn(e.target.value)}>
          <option value="both">Invoice &amp; STN</option><option value="invoice">Invoice</option><option value="stn">STN</option>
        </select>
        <select aria-label="Location" style={{ width: 280 }} value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">Select Location</option>
          {(lk?.data?.locations || []).map((l) => { const o = locOpt(l); return <option key={o.value} value={o.value}>{o.label}</option>; })}
        </select>
        <button type="button" className="dms-btn" onClick={() => setApplied({ txn, location })}>GO</button>
      </div>
      {isLoading || !t ? <div className="dms-loading">Loading…</div> : (
        <>
          <div className="dms-tiles">
            <Tile bg="#28a745" icon={Tag} label="Sale" amount={t.sale.amount} qty={t.sale.qty} />
            <Tile bg="#ffc107" icon={ShoppingCart} label="Purchase" amount={t.purchase.amount} qty={t.purchase.qty} />
            <Tile bg="#17a2b8" icon={ShoppingBag} label="PO" amount={t.po.amount} qty={t.po.qty} />
            <Tile bg="#6c757d" icon={Briefcase} label="Collection" amount={t.collection.amount} />
            <Tile bg="#007bff" icon={Boxes} label="Inventory" qty={t.inventory.qty} amount={t.inventory.amount} />
            <Tile bg="#dc3545" icon={Scale} label="Outstanding" amount={t.outstanding.amount} />
          </div>
          <div className="dms-grid2">
            <ChartBox title="Top 5 Model Sale Of The Month">
              <BarChart data={d.topModels}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis width={62} tickFormatter={fmt.short} /><Tooltip /><Bar dataKey="qty" name="Qty" fill="#337ab7" /></BarChart>
            </ChartBox>
            <ChartBox title="Top 5 Seller Of The Month">
              <BarChart data={d.topSellers}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis width={62} tickFormatter={fmt.short} /><Tooltip /><Bar dataKey="amount" name="Amount" fill="#5cb85c" /></BarChart>
            </ChartBox>
            <ChartBox title="Current Month PO Status">
              <PieChart><Pie data={d.poStatus} dataKey="count" nameKey="status" outerRadius={90} label>{d.poStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ChartBox>
            <ChartBox title="Current Month Invoice Status">
              <PieChart><Pie data={d.invoiceStatus} dataKey="count" nameKey="status" outerRadius={90} label>{d.invoiceStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ChartBox>
          </div>
          <div className="dms-chart" style={{ marginBottom: 14 }}>
            <table className="dms-table"><thead><tr><th colSpan={2} className="c">Current Month PO Status</th></tr><tr><th>PO Status</th><th>Count</th></tr></thead>
              <tbody>{(d.poStatus || []).length ? d.poStatus.map((x) => <tr key={x.status}><td>{x.status}</td><td className="r">{x.count}</td></tr>) : <tr><td colSpan={2} className="c">No PO this month</td></tr>}</tbody></table>
          </div>
          <div className="dms-chart" style={{ marginBottom: 14 }}><h4>Last 12 Months Sale</h4>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 6 }}>{['Plain', 'Inverted', 'Polar'].map((k) => <button key={k} type="button" className={`dms-btn sm ${chart === k ? '' : 'default'}`} onClick={() => setChart(k)}>{k}</button>)}</div>
            <ResponsiveContainer width="100%" height={chart === 'Polar' ? 320 : 260}>
              {chart === 'Polar' ? (
                <RadarChart data={d.monthly}><PolarGrid /><PolarAngleAxis dataKey="month" /><PolarRadiusAxis tickFormatter={fmt.short} /><Tooltip /><Radar dataKey="amount" name="Amount (₹)" stroke="#17a2b8" fill="#17a2b8" fillOpacity={0.5} /></RadarChart>
              ) : chart === 'Inverted' ? (
                <BarChart data={d.monthly} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={fmt.short} /><YAxis type="category" dataKey="month" width={70} /><Tooltip /><Bar dataKey="amount" name="Amount (₹)" fill="#17a2b8" /></BarChart>
              ) : (
                <BarChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis width={62} tickFormatter={fmt.short} /><Tooltip /><Bar dataKey="amount" name="Amount (₹)" fill="#17a2b8" /></BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}
