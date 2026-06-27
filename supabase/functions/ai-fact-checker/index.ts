import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { content, genre } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env. get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const entityPattern = /\b([A-Z][a-z]+(? :'[A-Z][a-z]+)?)\b/g
    const potentialEntities = [... new Set(content.match(entityPattern) || [])]

    const { data: knownEntities } = await supabase
      . from('occult_knowledge_base')
      .select('name, entity_type, source')
      .in('name', potentialEntities)

    const knownNames = new Set(knownEntities?. map((e) => e.name) || [])
    const unknownEntities = potentialEntities.filter(name => 
      !knownNames.has(name) && 
      name.length > 4 && 
      !['Chapter', 'Lord', 'Dark', 'Great', 'Demon']. includes(name)
    )

    if (unknownEntities. length > 0) {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
      
      const verifyPrompt = `You are an expert on occult literature, specifically the Ars Goetia.  

The following entities were mentioned but are NOT in our verified database: 
${unknownEntities.join(', ')}

For each, determine: 
1. REAL entity from actual grimoires (provide source)
2. HALLUCINATION/invented entity

Respond ONLY in JSON: 
{
  "real":  [{"name": ".. .", "source": "..."}],
  "hallucinations": ["..."]
}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization':  `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON. stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content:  'You are a scholarly fact-checker for occult literature.  Be strict.  If unsure, mark as hallucination.' },
            { role: 'user', content: verifyPrompt }
          ],
          temperature: 0.1,
        }),
      })

      const data = await response.json()
      const verification = JSON.parse(data.choices[0].message.content)

      return new Response(
        JSON.stringify({
          verified: verification.hallucinations.length === 0,
          hallucinations: verification.hallucinations,
          missingFromDb: verification.real,
          knownEntities: Array.from(knownNames),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        hallucinations: [],
        knownEntities: Array.from(knownNames)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ... corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
