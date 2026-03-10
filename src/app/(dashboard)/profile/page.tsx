'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import Button from '@/components/ui/Button';
import type { UserProfile, Fridge } from '@/types';

interface CorrectionChange {
  field: string;
  from: string;
  to: string;
  reason: string;
}

interface Correction {
  id: string;
  name: string;
  changes: CorrectionChange[];
  applied?: boolean;
}

interface DuplicateGroup {
  product_ids: string[];
  names: string[];
  suggestion: 'merge' | 'keep_separate';
  reason: string;
  resolved?: boolean;
}

interface ImageIssue {
  id: string;
  name: string;
  issue: 'receipt_as_image' | 'wrong_product' | 'unrelated';
  suggestion: string;
  resolved?: boolean;
}

type VerifyState = 'idle' | 'loading' | 'results' | 'done';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // AI Verify state
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [imageIssues, setImageIssues] = useState<ImageIssue[]>([]);

  const supabaseRef = useRef(createSupabaseBrowser());
  const supabase = supabaseRef.current;
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/setup');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData) {
        router.push('/setup');
        return;
      }

      const typedProfile = profileData as UserProfile;
      setProfile(typedProfile);

      const { data: fridgeData } = await supabase
        .from('fridges')
        .select('*')
        .eq('id', typedProfile.fridge_id)
        .single();

      if (fridgeData) {
        setFridge(fridgeData as Fridge);
      }

      setLoading(false);
    };

    load();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCopyCode = () => {
    if (!fridge) return;
    navigator.clipboard.writeText(fridge.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // AI Verify
  const handleVerify = useCallback(async () => {
    if (!fridge) return;
    setVerifyState('loading');
    setCorrections([]);
    setDuplicates([]);
    setImageIssues([]);

    try {
      const res = await fetch('/api/ai/verify-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fridge_id: fridge.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const c = (data.corrections || []) as Correction[];
      const d = (data.duplicates || []) as DuplicateGroup[];
      const img = (data.image_issues || []) as ImageIssue[];

      if (c.length === 0 && d.length === 0 && img.length === 0) {
        setVerifyState('done');
      } else {
        setCorrections(c);
        setDuplicates(d);
        setImageIssues(img);
        setVerifyState('results');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerifyState('idle');
    }
  }, [fridge]);

  // Apply a single correction
  const applyCorrection = useCallback(async (correction: Correction) => {
    const updates: Record<string, string> = {};
    for (const change of correction.changes) {
      updates[change.field] = change.to;
    }

    await supabase
      .from('products')
      .update(updates)
      .eq('id', correction.id);

    setCorrections((prev) =>
      prev.map((c) => (c.id === correction.id ? { ...c, applied: true } : c))
    );
  }, [supabase]);

  // Apply all corrections
  const applyAllCorrections = useCallback(async () => {
    for (const correction of corrections) {
      if (correction.applied) continue;
      await applyCorrection(correction);
    }
  }, [corrections, applyCorrection]);

  // Merge duplicates: keep the first product, sum quantities, delete others
  const mergeDuplicates = useCallback(async (group: DuplicateGroup) => {
    const ids = group.product_ids;
    if (ids.length < 2) return;

    // Fetch all products in the group
    const { data: products } = await supabase
      .from('products')
      .select('id, quantity')
      .in('id', ids);

    if (!products || products.length < 2) return;

    // Keep the first, sum quantities
    const keep = products[0];
    const totalQty = products.reduce((sum, p) => sum + ((p.quantity as number) || 1), 0);

    await supabase
      .from('products')
      .update({ quantity: totalQty })
      .eq('id', keep.id);

    // Delete the rest
    const deleteIds = ids.filter((id) => id !== keep.id);
    await supabase
      .from('products')
      .delete()
      .in('id', deleteIds);

    setDuplicates((prev) =>
      prev.map((d) =>
        d.product_ids[0] === group.product_ids[0] ? { ...d, resolved: true } : d
      )
    );
  }, [supabase]);

  // Dismiss a duplicate group
  const dismissDuplicate = useCallback((group: DuplicateGroup) => {
    setDuplicates((prev) =>
      prev.map((d) =>
        d.product_ids[0] === group.product_ids[0] ? { ...d, resolved: true } : d
      )
    );
  }, []);

  // Remove product image (set image_url to null)
  const removeProductImage = useCallback(async (issue: ImageIssue) => {
    await supabase
      .from('products')
      .update({ image_url: null })
      .eq('id', issue.id);

    setImageIssues((prev) =>
      prev.map((img) => (img.id === issue.id ? { ...img, resolved: true } : img))
    );
  }, [supabase]);

  const issueDescription = (issueType: ImageIssue['issue']) => {
    switch (issueType) {
      case 'receipt_as_image': return fr.verify.receiptAsImage;
      case 'wrong_product': return fr.verify.wrongProduct;
      case 'unrelated': return fr.verify.unrelatedImage;
    }
  };

  if (loading || !profile || !fridge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCorrections = corrections.filter((c) => !c.applied);
  const pendingDuplicates = duplicates.filter((d) => !d.resolved);
  const pendingImageIssues = imageIssues.filter((img) => !img.resolved);
  const allDone = verifyState === 'results' && pendingCorrections.length === 0 && pendingDuplicates.length === 0 && pendingImageIssues.length === 0;

  const fieldLabel = (field: string) => {
    if (field === 'location') return fr.verify.location;
    if (field === 'category') return fr.verify.category;
    return field;
  };

  const locationLabel = (val: string) => {
    const key = val as keyof typeof fr.locations;
    return fr.locations[key] || val;
  };

  const categoryLabel = (val: string) => {
    const key = val as keyof typeof fr.categories;
    return fr.categories[key] || val;
  };

  const valueLabel = (field: string, val: string) => {
    if (field === 'location') return locationLabel(val);
    if (field === 'category') return categoryLabel(val);
    return val;
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Back */}
      <button onClick={() => router.push('/dashboard')} className="text-sm text-primary mb-6 block">
        {fr.profile.back}
      </button>

      <h1 className="text-xl font-bold text-foreground mb-8">{fr.profile.title}</h1>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-2xl">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted">
            {profile.role === 'owner' ? fr.profile.roleOwner : fr.profile.roleMember}
          </p>
        </div>
      </div>

      {/* Fridge Info */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <p className="text-xs text-muted mb-1">{fr.profile.fridgeName}</p>
        <p className="font-medium text-foreground">{fridge.name}</p>
      </div>

      {/* Invite Code */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <p className="text-xs text-muted mb-1">{fr.profile.inviteCode}</p>
        <p className="text-xs text-muted mb-3">{fr.profile.inviteDesc}</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-mono font-bold text-primary tracking-wider flex-1">
            {fridge.invite_code}
          </p>
          <Button variant="secondary" size="sm" onClick={handleCopyCode}>
            {copied ? fr.profile.copied : fr.dashboard.copyCode}
          </Button>
        </div>
      </div>

      {/* AI Verify Inventory */}
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">{fr.verify.button}</p>
            <p className="text-xs text-muted">{fr.verify.buttonDesc}</p>
          </div>
        </div>

        {verifyState === 'idle' && (
          <Button onClick={handleVerify} variant="secondary" className="w-full mt-2" size="sm">
            {fr.verify.button}
          </Button>
        )}

        {verifyState === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted">{fr.verify.analyzing}</span>
          </div>
        )}

        {verifyState === 'done' && (
          <div className="text-center py-4">
            <p className="text-emerald-600 font-medium text-sm">{fr.verify.noIssues}</p>
            <p className="text-xs text-muted">{fr.verify.noIssuesDesc}</p>
          </div>
        )}
      </div>

      {/* Verify Results */}
      {verifyState === 'results' && (
        <div className="mb-8 flex flex-col gap-4">
          {/* Corrections */}
          {corrections.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">{fr.verify.corrections}</h2>
                {pendingCorrections.length > 1 && (
                  <button
                    onClick={applyAllCorrections}
                    className="text-xs text-primary font-medium"
                  >
                    {fr.verify.applyAll} ({pendingCorrections.length})
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {corrections.map((correction) => (
                  <div
                    key={correction.id}
                    className={`rounded-xl border p-3 transition-all duration-100 ${
                      correction.applied
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{correction.name}</p>
                      {correction.applied ? (
                        <span className="text-xs text-emerald-600 font-medium">{fr.verify.applied}</span>
                      ) : (
                        <button
                          onClick={() => applyCorrection(correction)}
                          className="text-xs bg-primary text-white px-3 py-1 rounded-lg font-medium active:scale-95 transition-transform duration-100"
                        >
                          {fr.verify.apply}
                        </button>
                      )}
                    </div>
                    {correction.changes.map((change, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-muted">{fieldLabel(change.field)}:</span>
                        <span className="text-red-500 line-through">{valueLabel(change.field, change.from)}</span>
                        <span className="text-muted">→</span>
                        <span className="text-emerald-600 font-medium">{valueLabel(change.field, change.to)}</span>
                      </div>
                    ))}
                    {correction.changes[0]?.reason && (
                      <p className="text-xs text-muted mt-1">{correction.changes[0].reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates */}
          {duplicates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">{fr.verify.duplicates}</h2>
              <div className="flex flex-col gap-2">
                {duplicates.map((group, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition-all duration-100 ${
                      group.resolved
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground flex-1">
                        {group.names.join(' + ')}
                      </p>
                      {group.resolved && (
                        <span className="text-xs text-emerald-600 font-medium">{fr.verify.merged}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mb-2">{group.reason}</p>
                    {!group.resolved && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => mergeDuplicates(group)}
                          className="flex-1 text-xs bg-primary text-white py-1.5 rounded-lg font-medium active:scale-95 transition-transform duration-100"
                        >
                          {fr.verify.merge}
                        </button>
                        <button
                          onClick={() => dismissDuplicate(group)}
                          className="flex-1 text-xs bg-input-bg text-muted py-1.5 rounded-lg font-medium border border-border active:scale-95 transition-transform duration-100"
                        >
                          {fr.verify.keepSeparate}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Issues */}
          {imageIssues.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">{fr.verify.imageIssues}</h2>
              <div className="flex flex-col gap-2">
                {imageIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`rounded-xl border p-3 transition-all duration-100 ${
                      issue.resolved
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                        : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{issue.name}</p>
                      {issue.resolved ? (
                        <span className="text-xs text-emerald-600 font-medium">{fr.verify.imageRemoved}</span>
                      ) : (
                        <button
                          onClick={() => removeProductImage(issue)}
                          className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg font-medium active:scale-95 transition-transform duration-100"
                        >
                          {fr.verify.removeImage}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted">{issueDescription(issue.issue)}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-muted mt-1 italic">{issue.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All done */}
          {allDone && (
            <div className="text-center py-2">
              <button
                onClick={() => { setVerifyState('idle'); setCorrections([]); setDuplicates([]); setImageIssues([]); }}
                className="text-sm text-primary font-medium"
              >
                {fr.verify.done}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sign Out */}
      <Button variant="secondary" onClick={handleSignOut} className="w-full">
        {fr.profile.signOut}
      </Button>
    </div>
  );
}
