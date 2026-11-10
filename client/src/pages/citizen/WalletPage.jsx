import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { useWallet, shortAddr } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../api/client';
import { Button, Card, CardHeader, PageHeader, fmtNum } from '../../components/ui';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold">{children}</span>
    </div>
  );
}

export default function WalletPage() {
  const w = useWallet();
  const toast = useToast();
  const [busy, setBusy] = useState('');

  const run = (key, fn, okMsg) => async () => {
    setBusy(key);
    try { await fn(); if (okMsg) toast.success(okMsg); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  const connected = Boolean(w.account);
  return (
    <>
      <PageHeader title="My wallet" subtitle="Connect MetaMask to link your wallet and see your ECO balance." />

      {!w.hasMetaMask && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>MetaMask was not detected in this browser. <a className="font-semibold underline" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Install MetaMask</a> and refresh this page.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Wallet status" />
          <div className="px-5 py-2">
            <Row label="Connection">{connected ? <span className="inline-flex items-center gap-1.5 text-emerald"><CheckCircle2 className="h-4 w-4" /> Connected</span> : <span className="text-muted">Not connected</span>}</Row>
            <Row label="Connected address">{connected ? <span className="font-mono text-xs" title={w.account}>{shortAddr(w.account)}</span> : '·'}</Row>
            <Row label="Network">
              {!connected ? '·' : w.isSepolia ? <span className="text-emerald">Sepolia</span> : <span className="text-amber-600">Wrong network (id {w.chainId})</span>}
            </Row>
            <Row label="Linked to my EcoChain account">
              {w.linkedAddress ? <span className="font-mono text-xs" title={w.linkedAddress}>{shortAddr(w.linkedAddress)}</span> : <span className="text-amber-600">Not linked yet</span>}
            </Row>
            <Row label="ECO balance (on-chain)">{w.ecoBalance !== null ? `${fmtNum(w.ecoBalance, 3)} ECO` : '·'}</Row>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 p-5">
            {!connected && <Button onClick={run('connect', w.connect, 'MetaMask connected')} loading={busy === 'connect'} disabled={!w.hasMetaMask}><Wallet className="h-4 w-4" /> Connect MetaMask</Button>}
            {connected && !w.isSepolia && <Button variant="dark" onClick={run('switch', w.switchToSepolia)} loading={busy === 'switch'}>Switch to Sepolia</Button>}
            {connected && (!w.linkedAddress || !w.matchesLinked) && (
              <Button onClick={run('link', w.linkWallet, 'Wallet linked to your account')} loading={busy === 'link'}>
                <ShieldCheck className="h-4 w-4" /> {w.linkedAddress ? 'Link this wallet instead' : 'Link wallet to my account'}
              </Button>
            )}
            <Link to="/app/transactions" className="btn btn-outline"><ExternalLink className="h-4 w-4" /> View transactions</Link>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Your keys stay yours</h3>
          <p className="mt-2 text-sm text-muted">EcoChain only ever sees your public address. We never ask for your seed phrase or private key, and nobody from EcoChain will.</p>
          <p className="mt-3 text-sm text-muted">Linking asks you to sign a short message. This is free, is <strong>not</strong> a transaction, and only proves that the address is yours.</p>
          {w.linkedAddress && w.account && !w.matchesLinked && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">MetaMask is using a different account than the one linked to EcoChain. Rewards are sent to the linked address.</p>
          )}
        </Card>
      </div>
    </>
  );
}
