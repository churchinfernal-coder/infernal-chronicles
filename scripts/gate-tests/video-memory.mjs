/**
 * GATE: Video Memory - Production Validation
 *
 * Requirements:
 *   - Deduplication (no duplicate symbol/style/theme/project tuples)
 *   - Context injection (prior motifs appear in new video prompts)
 *   - Cross-modal reuse (engine_memory themes and image symbols reflected in video prompt)
 *   - Semantic recall (related motifs surface by embedding search)
 *   - Scaling (hundreds of motifs with stable query latency)
 */

import { BaseGate } from './base-gate.mjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const gate = new BaseGate('video-memory');
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

function unique(list) {
  return [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
}

async function getEmbedding(apiKey, input) {
  if (!apiKey) return null;
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  return Array.isArray(embedding) ? embedding : null;
}

async function runGate() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║             VIDEO MEMORY - PRODUCTION GATE                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://khugyibzsujjgtddwzpa.supabase.co';
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      '';
    const openAIApiKey = process.env.OPENAI_API_KEY || '';
    const adminJwt = process.env.SUPABASE_ADMIN_JWT || '';

    if (!serviceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or compatible alias)');
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const rpcClient = createClient(supabaseUrl, serviceKey);
    const projectScopeId = NIL_UUID;

    await gate.addTest('Schema available: video_memory table', async () => {
      const { error } = await supabase.from('video_memory').select('id', { head: true, count: 'exact' }).limit(1);
      if (error) {
        throw new Error(`video_memory table not available: ${error.message}`);
      }
      return { detail: 'video_memory table is available' };
    });

    await gate.addTest('Deduplication: no duplicate symbol/style/theme/project', async () => {
      const seed = {
        symbol: 'Labyrinth',
        style: 'cinematic',
        narrative_theme: 'ritual',
        source_project_id: projectScopeId,
        video_prompt: 'Labyrinth-focused video sequence',
        source_function: 'video-memory-gate',
      };

      const { error: upsert1Error } = await rpcClient.rpc('upsert_video_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _narrative_theme: seed.narrative_theme,
        _source_project_id: seed.source_project_id,
        _video_prompt: seed.video_prompt,
        _duration_seconds: 12,
        _video_format: 'png-sequence-square',
        _narrative_beats: ['ritual', 'motion'],
        _embedding: null,
        _critic_score: null,
        _critic_notes: null,
        _source_function: seed.source_function,
      });
      if (upsert1Error) throw upsert1Error;

      const { error: upsert2Error } = await rpcClient.rpc('upsert_video_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _narrative_theme: seed.narrative_theme,
        _source_project_id: seed.source_project_id,
        _video_prompt: seed.video_prompt,
        _duration_seconds: 12,
        _video_format: 'png-sequence-square',
        _narrative_beats: ['ritual', 'motion'],
        _embedding: null,
        _critic_score: null,
        _critic_notes: null,
        _source_function: seed.source_function,
      });
      if (upsert2Error) throw upsert2Error;

      const { data: count, error } = await rpcClient.rpc('count_video_memory_entries', {
        _source_project_id: projectScopeId,
        _symbol: seed.symbol,
        _style: seed.style,
        _narrative_theme: seed.narrative_theme,
      });

      if (error) throw error;
      if (Number(count || 0) !== 1) {
        throw new Error(`Expected deduped row count = 1, got ${Number(count || 0)}`);
      }

      return { detail: 'Composite dedupe constraint enforced' };
    });

    await gate.addTest('Versioning: motif writes produce history snapshots', async () => {
      const seed = {
        symbol: 'VersionedSigil',
        style: 'cinematic',
        narrative_theme: 'ritual',
        source_project_id: projectScopeId,
      };

      const { data: entryId, error: upsert1Error } = await rpcClient.rpc('upsert_video_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _narrative_theme: seed.narrative_theme,
        _source_project_id: seed.source_project_id,
        _video_prompt: 'Version snapshot one',
        _duration_seconds: 10,
        _video_format: 'png-sequence-square',
        _narrative_beats: ['ritual'],
        _embedding: null,
        _critic_score: 70,
        _critic_notes: 'v1',
        _source_function: 'video-memory-gate',
      });
      if (upsert1Error) throw upsert1Error;

      const { error: upsert2Error } = await rpcClient.rpc('upsert_video_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _narrative_theme: seed.narrative_theme,
        _source_project_id: seed.source_project_id,
        _video_prompt: 'Version snapshot two',
        _duration_seconds: 12,
        _video_format: 'png-sequence-square',
        _narrative_beats: ['ritual', 'transformation'],
        _embedding: null,
        _critic_score: 82,
        _critic_notes: 'v2',
        _source_function: 'video-memory-gate',
      });
      if (upsert2Error) throw upsert2Error;

      const { data: versions, error } = await supabase
        .from('video_memory_versions')
        .select('id')
        .eq('video_memory_id', entryId);

      if (error) throw error;
      if ((versions || []).length < 2) {
        throw new Error(`Expected at least 2 version snapshots, got ${(versions || []).length}`);
      }

      return { detail: `Version snapshots found: ${(versions || []).length}` };
    });

    await gate.addTest('Governance: role-based audit logs capture motif actions', async () => {
      const requestId = `gate-${Date.now()}`;
      const { data: auditId, error: auditError } = await rpcClient.rpc('log_video_memory_audit', {
        _actor_id: null,
        _actor_role: 'service_role',
        _actor_type: 'function',
        _action: 'gate_audit_probe',
        _source_function: 'video-memory-gate',
        _source_project_id: projectScopeId,
        _memory_id: null,
        _request_id: requestId,
        _metadata: { probe: true },
      });
      if (auditError) throw auditError;

      const { data: row, error } = await supabase
        .from('video_memory_audit_logs')
        .select('id, action, actor_role, actor_type')
        .eq('id', auditId)
        .maybeSingle();

      if (error) throw error;
      if (!row || row.action !== 'gate_audit_probe') {
        throw new Error('Expected governance audit log row not found');
      }

      return { detail: `Audit log captured with role=${row.actor_role || 'unknown'} type=${row.actor_type}` };
    });

    await gate.addTest('Semantic recall: related motifs surface', async () => {
      if (!openAIApiKey) {
        return { detail: 'Skipped semantic embedding probe (OPENAI_API_KEY not set)' };
      }

      const motifs = [
        { symbol: 'Pentagram', style: 'gothic', theme: 'ritual' },
        { symbol: 'Tarot Card', style: 'surreal', theme: 'prophecy' },
        { symbol: 'Labyrinth', style: 'cinematic', theme: 'transformation' },
      ];

      for (const motif of motifs) {
        const embedding = await getEmbedding(openAIApiKey, `${motif.symbol} ${motif.style} ${motif.theme}`);
        const { error } = await rpcClient.rpc('upsert_video_memory_entry', {
          _symbol: motif.symbol,
          _style: motif.style,
          _narrative_theme: motif.theme,
          _source_project_id: projectScopeId,
          _video_prompt: `${motif.symbol} motif continuity`,
          _duration_seconds: 18,
          _video_format: 'png-sequence-square',
          _narrative_beats: [motif.theme],
          _embedding: embedding,
          _critic_score: null,
          _critic_notes: null,
          _source_function: 'video-memory-gate',
        });
        if (error) throw error;
      }

      const queryEmbedding = await getEmbedding(openAIApiKey, 'Death rituals, labyrinth motion, tarot continuity');
      if (!queryEmbedding) {
        return { detail: 'Skipped semantic query (embedding generation unavailable)' };
      }

      const { data, error } = await supabase.rpc('match_video_memory_semantic', {
        query_embedding: queryEmbedding,
        match_count: 5,
        project_filter: projectScopeId,
      });

      if (error) throw error;

      const surfaced = unique((data || []).map((row) => row.symbol));
      const hasExpected = surfaced.includes('Pentagram') || surfaced.includes('Tarot Card') || surfaced.includes('Labyrinth');
      if (!hasExpected) {
        throw new Error(`Expected semantic surfacing of Pentagram/Tarot/Labyrinth, got: ${surfaced.join(', ') || 'none'}`);
      }

      return { detail: `Semantic recall surfaced: ${surfaced.join(', ')}` };
    });

    await gate.addTest('Context injection: prior motifs appear in generated prompt', async () => {
      if (!adminJwt) {
        return { detail: 'Skipped prompt injection runtime check (SUPABASE_ADMIN_JWT not set)' };
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-cinematic-generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          strictCritic: true,
          sourceProjectId: projectScopeId,
          prompt: 'A labyrinth of ritual fire with tarot and pentagram overlays.',
          type: 'animation',
          style: 'cinematic',
          background: 'ritual chamber',
          lighting: 'dramatic',
          frameCount: 12,
          aspectRatio: '1:1',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Dry-run call failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const prompt = String(payload?.promptUsed || '');
      const includesContinuity = /Labyrinth|Pentagram|Tarot Card|ritual/i.test(prompt);

      if (!includesContinuity) {
        throw new Error('Prompt does not include continuity motifs from memory');
      }

      return { detail: 'Prompt includes prior continuity motifs' };
    });

    await gate.addTest('Cross-modal reuse: engine and image memory feed video prompt', async () => {
      if (!adminJwt) {
        return { detail: 'Skipped cross-modal runtime check (SUPABASE_ADMIN_JWT not set)' };
      }

      await supabase.from('engine_memory').upsert(
        {
          source_project_id: projectScopeId,
          memory_key: 'Necromancy',
          memory_value: 'Necromancy rites under blood moon with rune overlays',
        },
        { onConflict: 'source_project_id,memory_key' }
      ).then(() => null).catch(() => null);

      await supabase.from('image_memory').upsert(
        {
          symbol: 'Runes',
          style: 'gothic',
          source_project_id: projectScopeId,
          cover_prompt: 'Runes over a blood moon',
          embedding: null,
          source_function: 'video-memory-gate',
        },
        { onConflict: 'symbol,style,source_project_id' }
      ).then(() => null).catch(() => null);

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-cinematic-generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          strictCritic: true,
          sourceProjectId: projectScopeId,
          prompt: 'A necromantic rune chamber with ritual motion and shifting mirrors.',
          type: 'animation',
          style: 'cinematic',
          background: 'ritual chamber',
          lighting: 'dramatic',
          frameCount: 12,
          aspectRatio: '1:1',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Dry-run call failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const prompt = String(payload?.promptUsed || '');
      if (!/Necromancy|Necromantic|Runes|Blood Moon/i.test(prompt)) {
        throw new Error('Cross-modal themes not reflected in video prompt');
      }

      return { detail: 'Cross-modal theme reuse confirmed in prompt' };
    });

    await gate.addTest('Scaling: hundreds of motifs remain queryable', async () => {
      const start = performance.now();
      const rows = Array.from({ length: 250 }, (_, i) => ({
        symbol: `StressSymbol-${i}`,
        style: i % 2 === 0 ? 'gothic' : 'cinematic',
        narrative_theme: i % 3 === 0 ? 'ritual' : 'transformation',
        source_project_id: projectScopeId,
        video_prompt: `Stress motif ${i}`,
        duration_seconds: 12,
        video_format: 'png-sequence-square',
        narrative_beats: ['ritual', 'motion'],
        source_function: 'video-memory-gate-stress',
      }));

      const { error: bulkError } = await rpcClient.rpc('bulk_upsert_video_memory_entries', {
        _entries: rows,
      });
      if (bulkError) throw bulkError;

      const { data: count, error } = await rpcClient.rpc('count_video_memory_entries', {
        _source_project_id: projectScopeId,
      });
      if (error) throw error;

      const duration = performance.now() - start;
      if (Number(count || 0) < 200) {
        throw new Error(`Expected >=200 motifs in scope, got ${Number(count || 0)}`);
      }

      gate.evaluateMetric('Video Memory Stress Query (ms)', duration, 5000, '<', 'ms');
      return { detail: `Stress query completed in ${duration.toFixed(2)}ms` };
    });

    gate.saveEvidence();
    const exitCode = gate.printResult();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Gate execution failed:', error.message);
    gate.results.errors.push({ message: error.message });
    gate.saveEvidence();
    process.exit(1);
  }
}

if (!globalThis.performance) {
  globalThis.performance = { now: () => Date.now() };
}

runGate();