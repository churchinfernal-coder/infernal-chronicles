/**
 * GATE: Image Memory - Production Validation
 *
 * Requirements:
 *   - Deduplication (no duplicate symbol/style/project tuples)
 *   - Context injection (prior motifs appear in new cover prompts)
 *   - Cross-modal reuse (engine_memory themes reflected in cover prompt)
 *   - Semantic recall (related symbols surface by embedding search)
 *   - Scaling (hundreds of motifs with stable query latency)
 */

import { BaseGate } from './base-gate.mjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const gate = new BaseGate('image-memory');
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
  console.log('║            IMAGE MEMORY - PRODUCTION GATE                      ║');
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

    await gate.addTest('Schema available: image_memory table', async () => {
      const { error } = await supabase.from('image_memory').select('id', { head: true, count: 'exact' }).limit(1);
      if (error) {
        throw new Error(`image_memory table not available: ${error.message}`);
      }
      return { detail: 'image_memory table is available' };
    });

    await gate.addTest('Deduplication: no duplicate symbol/style/project', async () => {
      const seed = {
        symbol: 'Tarot Card',
        style: 'gothic',
        source_project_id: projectScopeId,
        cover_prompt: 'Tarot-focused cover',
        source_function: 'image-memory-gate',
      };

      const { error: upsert1Error } = await rpcClient.rpc('upsert_image_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _source_project_id: seed.source_project_id,
        _book_id: null,
        _cover_prompt: seed.cover_prompt,
        _embedding: null,
        _critic_score: null,
        _critic_notes: null,
        _source_function: seed.source_function,
      });
      if (upsert1Error) throw upsert1Error;

      const { error: upsert2Error } = await rpcClient.rpc('upsert_image_memory_entry', {
        _symbol: seed.symbol,
        _style: seed.style,
        _source_project_id: seed.source_project_id,
        _book_id: null,
        _cover_prompt: seed.cover_prompt,
        _embedding: null,
        _critic_score: null,
        _critic_notes: null,
        _source_function: seed.source_function,
      });
      if (upsert2Error) throw upsert2Error;

      const { data: count, error } = await rpcClient.rpc('count_image_memory_entries', {
        _source_project_id: projectScopeId,
        _symbol: seed.symbol,
        _style: seed.style,
      });

      if (error) throw error;
      if (Number(count || 0) !== 1) {
        throw new Error(`Expected deduped row count = 1, got ${Number(count || 0)}`);
      }

      return { detail: 'Composite dedupe constraint enforced' };
    });

    await gate.addTest('Semantic recall: related motifs surface', async () => {
      if (!openAIApiKey) {
        return { detail: 'Skipped semantic embedding probe (OPENAI_API_KEY not set)' };
      }

      const motifs = [
        { symbol: 'Runes', style: 'gothic' },
        { symbol: 'Tarot Card', style: 'surreal' },
        { symbol: 'Occult Sigils', style: 'cinematic' },
      ];

      for (const motif of motifs) {
        const embedding = await getEmbedding(openAIApiKey, `${motif.symbol} ${motif.style}`);
        const { error } = await rpcClient.rpc('upsert_image_memory_entry', {
          _symbol: motif.symbol,
          _style: motif.style,
          _source_project_id: projectScopeId,
          _book_id: null,
          _cover_prompt: `${motif.symbol} motif continuity`,
          _embedding: embedding,
          _critic_score: null,
          _critic_notes: null,
          _source_function: 'image-memory-gate',
        });
        if (error) throw error;
      }

      const queryEmbedding = await getEmbedding(openAIApiKey, 'Occult symbols and rune tarot continuity');
      if (!queryEmbedding) {
        return { detail: 'Skipped semantic query (embedding generation unavailable)' };
      }

      const { data, error } = await supabase.rpc('match_image_memory_semantic', {
        query_embedding: queryEmbedding,
        match_count: 5,
        project_filter: projectScopeId,
      });

      if (error) throw error;

      const surfaced = unique((data || []).map((row) => row.symbol));
      const hasExpected = surfaced.includes('Runes') || surfaced.includes('Tarot Card');
      if (!hasExpected) {
        throw new Error(`Expected semantic surfacing of Runes/Tarot, got: ${surfaced.join(', ') || 'none'}`);
      }

      return { detail: `Semantic recall surfaced: ${surfaced.join(', ')}` };
    });

    await gate.addTest('Context injection: prior symbols appear in generated prompt', async () => {
      if (!adminJwt) {
        return { detail: 'Skipped prompt injection runtime check (SUPABASE_ADMIN_JWT not set)' };
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-generate-book-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          strictCritic: true,
          sourceProjectId: projectScopeId,
          title: 'The Runes of the Veil',
          description: 'A necromantic ritual codex with tarot and sigil continuity.',
          genre: 'Occult Fantasy',
          setting: 'Catacombs beneath a blood moon',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Dry-run call failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const prompt = String(payload?.promptUsed || '');
      const includesContinuity = /Runes|Tarot Card|Occult Sigils/i.test(prompt);

      if (!includesContinuity) {
        throw new Error('Prompt does not include continuity motifs from memory');
      }

      return { detail: 'Prompt includes prior continuity motifs' };
    });

    await gate.addTest('Cross-modal reuse: engine themes feed visual prompt', async () => {
      if (!adminJwt) {
        return { detail: 'Skipped cross-modal runtime check (SUPABASE_ADMIN_JWT not set)' };
      }

      // Best-effort seed if engine_memory exists.
      await supabase.from('engine_memory').upsert(
        {
          source_project_id: projectScopeId,
          memory_key: 'Necromancy',
          memory_value: 'Necromancy rites under blood moon with ritual altar',
        },
        { onConflict: 'source_project_id,memory_key' }
      ).then(() => null).catch(() => null);

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-generate-book-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          strictCritic: true,
          sourceProjectId: projectScopeId,
          title: 'Necromancer\'s Testament',
          description: 'An infernal manuscript of necromantic rites.',
          genre: 'Occult',
          setting: 'Moonlit crypt',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Dry-run call failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const prompt = String(payload?.promptUsed || '');
      if (!/Necromancy|Necromantic|Ritual Altar/i.test(prompt)) {
        throw new Error('Cross-modal themes not reflected in cover prompt');
      }

      return { detail: 'Cross-modal theme reuse confirmed in prompt' };
    });

    await gate.addTest('Scaling: hundreds of motifs remain queryable', async () => {
      const start = performance.now();
      const rows = Array.from({ length: 250 }, (_, i) => ({
        symbol: `StressSymbol-${i}`,
        style: i % 2 === 0 ? 'gothic' : 'cinematic',
        source_project_id: projectScopeId,
        cover_prompt: `Stress motif ${i}`,
        source_function: 'image-memory-gate-stress',
      }));

      for (const row of rows) {
        const { error } = await rpcClient.rpc('upsert_image_memory_entry', {
          _symbol: row.symbol,
          _style: row.style,
          _source_project_id: row.source_project_id,
          _book_id: null,
          _cover_prompt: row.cover_prompt,
          _embedding: null,
          _critic_score: null,
          _critic_notes: null,
          _source_function: row.source_function,
        });
        if (error) throw error;
      }

      const { data: count, error } = await rpcClient.rpc('count_image_memory_entries', {
        _source_project_id: projectScopeId,
      });
      if (error) throw error;

      const duration = performance.now() - start;
      if (Number(count || 0) < 200) {
        throw new Error(`Expected >=200 motifs in scope, got ${Number(count || 0)}`);
      }

      gate.evaluateMetric('Image Memory Stress Query (ms)', duration, 5000, '<', 'ms');
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
