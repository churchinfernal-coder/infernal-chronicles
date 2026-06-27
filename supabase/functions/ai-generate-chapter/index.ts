import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env. get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const body = await req. json()
    const { generateTOC, genre, prompt, setting, chapterNumber, chapterTitle, length = 3000, style = 'narrative', language = 'english' } = body

    if (generateTOC) {
      const tocPrompt = `Generate a table of contents for a ${genre} book. 

Premise: ${prompt}
Setting: ${setting}

Return ONLY a JSON array with 15-20 chapters:  
[
  {"chapterNumber": 1, "title":  "Chapter Title", "description":  "Brief summary"}
]`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages:  [
            { role: 'system', content: 'You are a professional book editor.  Return ONLY valid JSON.' },
            { role: 'user', content: tocPrompt }
          ],
          temperature: 0.8,
        }),
      })

      const data = await response. json()
      const tableOfContents = JSON.parse(data. choices[0].message.content)

      return new Response(JSON. stringify({ tableOfContents }), {
        headers: { ...corsHeaders, 'Content-Type':  'application/json' },
      })
    }

    const chapterPrompt = `Write Chapter ${chapterNumber} of a ${genre} book. 

Title: ${chapterTitle}
Premise: ${prompt}
Setting:  ${setting}
Style: ${style}
Length: ${length} words
Language: ${language === 'spanish' ? 'Spanish (español)' : 'English'}

Write a complete, engaging chapter with vivid descriptions, dialogue, and narrative progression.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body:  JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a professional ${genre} author. ` },
          { role: 'user', content: chapterPrompt }
        ],
        temperature: 0.85,
        max_tokens: Math.min(length * 2, 4000),
      }),
    })

    const data = await response.json()
    const content = data. choices[0].message.content
    const wordCount = content.trim().split(/\s+/).length

    return new Response(
      JSON.stringify({ content, wordCount }),
      { headers: { ... corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON. stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
