import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Coins, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useWallet, shortAddr } from '../../context/WalletContext';
import Evidence from '../../components/Evidence';
import { Badge, Button, Card, CardHeader, Modal, PageHeader, TxLink, fmtDate, fmtNum, cap } from '../../components/ui';

function Info({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const toast = useToast();
  const wallet = useWallet();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [explorer, setExplorer] = useState(wallet.config.explorerBaseUrl);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/submissions/${id}`);
      setData(data);
    } catch (e) { toast.error(errMsg(e)); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setExplorer(wallet.config.explorerBaseUrl); }, [wallet.config.explorerBaseUrl]);

  if (!data) return <div className="skeleton h-96" />;
  const s = data.submission;
  const reward = s.reward;

  const act = (key, fn) => async () => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  const approve = act('approve', async () => {
    await api.post(`/admin/submissions/${id}/approve`, {});
    toast.success('Submission approved');
    await load();
  });

  const reject = act('reject', async () => {
    if (reason.trim().length < 5) return setReasonErr('Please give a reason (at least 5 characters)');
    await api.post(`/admin/submissions/${id}/reject`, { reason });
    toast.success('Submission rejected');
    setRejectOpen(false);
    await load();
  });

  // --- The real blockchain step -------------------------------------------------------
  // 1. Ask the server what to send. 2. Check the contract. 3. Sign in MetaMask.
  // 4. Give the transaction hash to the server, which verifies it on-chain itself.
  const authorize = act('reward', async () => {
    if (!wallet.hasMetaMask) throw new Error('MetaMask is required to authorise rewards');
    if (!wallet.account) await wallet.connect();
    if (!wallet.isSepolia) { await wallet.switchToSepolia(); toast.info('Switched to Sepolia. Click Authorise reward again.'); return; }

    const { data: p } = await api.get(`/admin/submissions/${id}/reward-params`);
    const readC = await wallet.getContract(false);

    if (await readC.paused()) throw new Error('The contract is paused by its owner');
    if (await readC.isRewarded(p.onchainId)) {
      throw new Error('The contract says this submission was already rewarded. Check the Blockchain Records page; do not retry.');
    }
    const role = await readC.REWARD_ADMIN_ROLE();
    if (!(await readC.hasRole(role, wallet.account))) {
      throw new Error(`The connected wallet (${shortAddr(wallet.account)}) is not an authorised reward admin on the contract.`);
    }

    const c = await wallet.getContract(true);
    toast.info('Confirm the transaction in MetaMask…');
    const tx = await c.rewardRecycling(p.citizen, p.onchainId, p.categoryIndex, p.grams);

    const { data: rec } = await api.post('/admin/rewards', { submissionId: id, transactionHash: tx.hash });
    toast.info('Transaction sent. Waiting for confirmation…');
    await load();

    await tx.wait(1);
    const { data: r } = await api.post(`/admin/rewards/${rec.reward.id}/refresh`);
    toast[r.reward.transactionStatus === 'CONFIRMED' ? 'success' : 'info'](
      r.reward.transactionStatus === 'CONFIRMED' ? 'Reward confirmed on the blockchain' : 'Transaction mined; still verifying…'
    );
    await load();
  });

  const refresh = act('refresh', async () => {
    const { data: r } = await api.post(`/admin/rewards/${reward.id}/refresh`);
    toast.info(`Reward status: ${r.reward.transactionStatus}${r.reward.failureReason ? ` (${r.reward.failureReason})` : ''}`);
    await load();
  });

  const canReward = (s.status === 'APPROVED') || (s.status === 'REWARD_PROCESSING' && reward?.transactionStatus === 'FAILED');
  const noWallet = !s.citizen.walletAddress;

  return (
    <>
      <Link to="/admin/submissions" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to submissions</Link>
      <PageHeader title="Verify recycling submission" subtitle={`ID ${s.id}`} action={<Badge status={s.status} />} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Evidence photograph" />
          <div className="p-5"><Evidence url={s.evidenceUrl} /></div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Citizen" />
            <div className="px-5 py-1">
              <Info label="Name">{s.citizen.fullName}</Info>
              <Info label="Email">{s.citizen.email}</Info>
              <Info label="Wallet">{s.citizen.walletAddress ? <span className="font-mono text-xs">{shortAddr(s.citizen.walletAddress)}</span> : <span className="text-amber-600">Not linked</span>}</Info>
              <Info label="Previously verified">{data.citizenVerifiedCount} submissions</Info>
            </div>
          </Card>
          <Card>
            <CardHeader title="Recycling details" />
            <div className="px-5 py-1">
              <Info label="Category">{cap(s.wasteCategory)}</Info>
              <Info label="Quantity">{s.quantityKg} kg</Info>
              <Info label="Location">{s.collectionLocation}</Info>
              <Info label="Recycling date">{fmtDate(s.recyclingDate)}</Info>
              <Info label="Submitted">{fmtDate(s.createdAt)}</Info>
              <Info label="Estimated reward">{fmtNum(s.estimatedTokens, 3)} ECO</Info>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Decision and reward" />
        <div className="space-y-4 p-5">
          {s.status === 'PENDING' && (
            <div className="flex flex-wrap gap-3">
              <Button onClick={approve} loading={busy === 'approve'}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
              <Button variant="danger" onClick={() => { setReason(''); setReasonErr(''); setRejectOpen(true); }}><XCircle className="h-4 w-4" /> Reject</Button>
            </div>
          )}
          {s.status === 'REJECTED' && <p className="text-sm text-red-600">Rejected: {s.rejectionReason}</p>}

          {canReward && (
            <div className="rounded-xl bg-canvas p-4">
              <p className="text-sm font-semibold">Authorise ECO reward</p>
              <p className="mt-1 text-sm text-muted">You will sign the transaction in your own MetaMask wallet. The smart contract refuses a second reward for the same submission.</p>
              {noWallet && <p className="mt-3 flex items-center gap-2 text-sm text-amber-700"><ShieldAlert className="h-4 w-4" /> This citizen has not linked a wallet yet, so a reward cannot be sent.</p>}
              {reward?.transactionStatus === 'FAILED' && <p className="mt-3 text-sm text-red-600">Previous attempt failed: {reward.failureReason}. You may retry.</p>}
              <Button className="mt-4" onClick={authorize} loading={busy === 'reward'} disabled={noWallet}><Coins className="h-4 w-4" /> {reward?.transactionStatus === 'FAILED' ? 'Retry reward' : 'Authorise reward'}</Button>
            </div>
          )}

          {reward && reward.transactionStatus !== 'FAILED' && (
            <div className="rounded-xl bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Reward {reward.transactionStatus === 'CONFIRMED' ? 'confirmed' : 'in progress'}</p>
                  <p className="mt-1 text-sm text-muted">{fmtNum(reward.tokenAmount, 3)} ECO · <TxLink hash={reward.transactionHash} base={explorer} /></p>
                  {reward.failureReason && reward.transactionStatus === 'PROCESSING' && <p className="mt-1 text-xs text-amber-700">{reward.failureReason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={reward.transactionStatus} />
                  {reward.transactionStatus === 'PROCESSING' && <Button variant="outline" onClick={refresh} loading={busy === 'refresh'}><RefreshCw className="h-4 w-4" /> Refresh status</Button>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject submission"
        footer={<><Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button><Button variant="danger" onClick={reject} loading={busy === 'reject'}>Reject submission</Button></>}>
        <label className="label">Reason (shown to the citizen)</label>
        <textarea className="input min-h-28" value={reason} onChange={(e) => { setReason(e.target.value); setReasonErr(''); }} placeholder="e.g. The photo does not show the stated quantity." />
        {reasonErr && <p className="mt-1 text-xs text-red-600">{reasonErr}</p>}
      </Modal>
    </>
  );
}
