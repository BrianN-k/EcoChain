import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Medal, Receipt, Rocket, Trophy } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { Badge, Card, CardHeader, EmptyState, PageHeader, SkeletonRows, StatCard, Table, TxLink, fmtDate, fmtNum, cap } from '../../components/ui';

function useRewards() {
  const toast = useToast();
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/citizen/rewards').then((r) => setData(r.data)).catch((e) => { toast.error(errMsg(e)); setData({ rewards: [], totalEarned: 0, explorerBaseUrl: '' }); });
  }, []);
  return data;
}

export function Rewards() {
  const data = useRewards();
  const wallet = useWallet();
  return (
    <>
      <PageHeader title="My rewards" subtitle="ECO tokens you have earned from verified recycling." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Coins} label="Total ECO earned (confirmed)" loading={!data} value={data && fmtNum(data.totalEarned, 3)} />
        <StatCard icon={Receipt} label="Current wallet balance" value={wallet.ecoBalance !== null ? `${fmtNum(wallet.ecoBalance, 3)} ECO` : '·'} hint={wallet.ecoBalance === null ? 'Connect MetaMask on Sepolia to read your on-chain balance' : 'Read directly from the blockchain'} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Reward history" />
        {!data ? <SkeletonRows /> : data.rewards.length === 0 ? (
          <EmptyState icon={Coins} title="No rewards yet" text="Once an administrator approves and rewards a submission, it appears here with its transaction hash." />
        ) : (
          <Table head={['Date', 'Activity', 'Tokens', 'Status', 'Transaction']}>
            {data.rewards.map((r) => (
              <tr key={r.id}>
                <td className="td">{fmtDate(r.createdAt)}</td>
                <td className="td">{cap(r.wasteCategory)} · {r.quantityKg} kg<p className="font-mono text-[11px] text-muted">{r.submissionId.slice(0, 8)}…</p></td>
                <td className="td font-semibold text-emerald">+{fmtNum(r.tokenAmount, 3)} ECO</td>
                <td className="td"><Badge status={r.transactionStatus} /></td>
                <td className="td"><TxLink hash={r.transactionHash} base={data.explorerBaseUrl} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6 border-dashed p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-muted"><Rocket className="h-6 w-6" /></span>
          <div className="flex-1">
            <h3 className="font-semibold">Redeem ECO tokens <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Coming soon</span></h3>
            <p className="text-sm text-muted">Spend tokens with partner shops and services. In this first version, you can earn and track ECO tokens only.</p>
          </div>
        </div>
      </Card>
    </>
  );
}

export function Transactions() {
  const data = useRewards();
  return (
    <>
      <PageHeader title="Transactions" subtitle="Your reward transactions on the Sepolia blockchain." />
      <Card>
        {!data ? <SkeletonRows /> : data.rewards.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" text="Reward transactions will be listed here with links to the block explorer." />
        ) : (
          <Table head={['Transaction hash', 'Type', 'Amount', 'Date', 'Status']}>
            {data.rewards.map((r) => (
              <tr key={r.id}>
                <td className="td"><TxLink hash={r.transactionHash} base={data.explorerBaseUrl} /></td>
                <td className="td">Recycling reward</td>
                <td className="td font-semibold">+{fmtNum(r.tokenAmount, 3)} ECO</td>
                <td className="td">{fmtDate(r.createdAt)}</td>
                <td className="td"><Badge status={r.transactionStatus} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

export function Leaderboard() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get('/leaderboard').then((r) => setRows(r.data.leaderboard)).catch((e) => { toast.error(errMsg(e)); setRows([]); });
  }, []);
  const medal = ['text-amber-500', 'text-slate-400', 'text-orange-600'];
  return (
    <>
      <PageHeader title="Community leaderboard" subtitle="Ranked by verified kilograms recycled. Only display names are shown." />
      <Card>
        {rows === null ? <SkeletonRows /> : rows.length === 0 ? (
          <EmptyState icon={Trophy} title="The leaderboard is empty" text="Get a submission approved to be the first on the board." action={<Link to="/app/submit" className="btn btn-primary">Submit recycling</Link>} />
        ) : (
          <Table head={['Rank', 'Citizen', 'Verified waste', 'ECO earned']}>
            {rows.map((r) => (
              <tr key={r.rank} className={r.isYou ? 'bg-mint/50' : ''}>
                <td className="td w-20 font-bold">{r.rank <= 3 ? <Medal className={`h-5 w-5 ${medal[r.rank - 1]}`} /> : `#${r.rank}`}</td>
                <td className="td font-semibold">{r.displayName} {r.isYou && <span className="ml-1 rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-white">YOU</span>}</td>
                <td className="td">{fmtNum(r.verifiedKg, 1)} kg</td>
                <td className="td font-semibold text-emerald">{fmtNum(r.tokensEarned, 2)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
