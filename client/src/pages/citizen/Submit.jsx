import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button, Card, CardHeader, Field, PageHeader } from '../../components/ui';

const CATS = [['PLASTIC', 'Plastic'], ['PAPER', 'Paper'], ['GLASS', 'Glass'], ['METAL', 'Metal']];
const today = () => new Date().toISOString().slice(0, 10);
const empty = { wasteCategory: '', quantityKg: '', collectionLocation: '', recyclingDate: today() };

export default function Submit() {
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Live reward estimate (the smart contract decides the final amount).
  useEffect(() => {
    const kg = Number(form.quantityKg);
    if (!form.wasteCategory || !(kg > 0)) return setEstimate(null);
    const t = setTimeout(() => {
      api.get('/citizen/estimate', { params: { category: form.wasteCategory, kg } }).then((r) => setEstimate(r.data)).catch(() => setEstimate(null));
    }, 300);
    return () => clearTimeout(t);
  }, [form.wasteCategory, form.quantityKg]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Please choose a JPG, PNG or WebP image');
      return (e.target.value = '');
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image is too large (maximum 5 MB)');
      return (e.target.value = '');
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const clearFile = () => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const validate = () => {
    const e = {};
    if (!form.wasteCategory) e.wasteCategory = 'Choose a waste category';
    const kg = Number(form.quantityKg);
    if (!(kg > 0)) e.quantityKg = 'Enter a quantity greater than 0';
    else if (kg > 1000) e.quantityKg = 'Maximum is 1000 kg per submission';
    if (form.collectionLocation.trim().length < 3) e.collectionLocation = 'Enter the collection location';
    if (!form.recyclingDate) e.recyclingDate = 'Choose the recycling date';
    else if (form.recyclingDate > today()) e.recyclingDate = 'Date cannot be in the future';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('evidence', file);
      const { data } = await api.post('/citizen/submissions', fd);
      setDone(data.submission);
      toast.success('Recycling submitted for verification');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const again = () => { setDone(null); setForm(empty); clearFile(); setEstimate(null); };

  if (done) {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center animate-fadeUp">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-emerald"><CheckCircle2 className="h-9 w-9" /></span>
        <h2 className="mt-5 text-2xl font-bold">Submission received</h2>
        <p className="mt-2 text-sm text-muted">An administrator will review it soon. You will be notified of the decision.</p>
        <p className="mt-5 text-xs text-muted">Submission ID</p>
        <p className="mt-1 break-all rounded-lg bg-canvas px-3 py-2 font-mono text-xs">{done.id}</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button variant="outline" onClick={again}>Submit another</Button>
          <Link to="/app/activities" className="btn btn-primary">View my activities</Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title="Submit recycling" subtitle="Tell us what you recycled. An administrator will verify it before any reward is issued." />
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recycling details" />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Waste category" error={errors.wasteCategory}>
              <select className="input" value={form.wasteCategory} onChange={set('wasteCategory')}>
                <option value="">Select category</option>
                {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Quantity (kg)" error={errors.quantityKg}>
              <input className="input" type="number" inputMode="decimal" min="0.001" step="0.001" placeholder="e.g. 2.5" value={form.quantityKg} onChange={set('quantityKg')} />
            </Field>
            <Field label="Collection location" error={errors.collectionLocation}>
              <input className="input" placeholder="e.g. Kilimani, Nairobi" value={form.collectionLocation} onChange={set('collectionLocation')} />
            </Field>
            <Field label="Recycling date" error={errors.recyclingDate}>
              <input className="input" type="date" max={today()} value={form.recyclingDate} onChange={set('recyclingDate')} />
            </Field>
            <div className="sm:col-span-2">
              <label className="label">Evidence photograph <span className="font-normal text-muted">(optional)</span></label>
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Selected evidence" className="h-44 rounded-xl object-cover" />
                  <button type="button" onClick={clearFile} aria-label="Remove image" className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow"><Trash2 className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-canvas px-4 py-8 text-center transition hover:border-emerald">
                  <ImagePlus className="h-7 w-7 text-emerald" />
                  <span className="mt-2 text-sm font-medium">Click to upload a photo</span>
                  <span className="text-xs text-muted">JPG, PNG or WebP · max 5 MB</span>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickFile} />
                </label>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-semibold text-muted">Estimated reward</p>
            <p className="mt-2 text-3xl font-extrabold text-forest">{estimate ? estimate.estimatedTokens : '·'} <span className="text-base text-emerald">ECO</span></p>
            <p className="mt-2 text-xs text-muted">{estimate ? `${estimate.ratePerKg} ECO per kg.` : 'Choose a category and quantity.'} The final amount is calculated by the smart contract after approval.</p>
          </Card>
          <Button type="submit" loading={busy} className="w-full py-3">Submit for verification</Button>
        </div>
      </form>
    </>
  );
}
