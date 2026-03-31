import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('profile_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', member.household_id)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*), accounts!inner(*)')
    .eq('accounts.household_id', member.household_id)
    .order('txn_date', { ascending: false })
    .limit(100)

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('household_id', member.household_id)

  const totalAssets = accounts?.filter(a => ['checking', 'savings', 'cash', 'investment'].includes(a.type))
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  const totalLiabilities = accounts?.filter(a => ['credit', 'loan'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0) || 0

  const netWorth = totalAssets - totalLiabilities

  const financialSummary = {
    netWorth,
    totalAssets,
    totalLiabilities,
    accountCount: accounts?.length || 0,
    recentTransactions: transactions?.slice(0, 20).map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.categories?.name,
      date: t.txn_date,
    })),
    goals: goals?.map(g => ({
      name: g.name,
      target: g.target_amount,
      saved: g.saved_amount,
      progress: (g.saved_amount / g.target_amount) * 100,
    })),
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a financial advisor AI. Analyze this household's financial data and provide insights.

Financial Summary:
${JSON.stringify(financialSummary, null, 2)}

Provide your analysis as JSON with this structure:
{
  "health_score": number (0-100),
  "summary": "Brief 1-2 sentence summary of financial health",
  "warnings": [
    { "title": "string", "description": "string" }
  ],
  "suggestions": [
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" }
  ],
  "forecast": {
    "trend": "improving" | "stable" | "declining",
    "projection": "Brief projection for next 3 months"
  }
}

Be specific, actionable, and encouraging. Return ONLY valid JSON.`,
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    const rawResponse = textContent ? (textContent as { type: 'text'; text: string }).text : '{}'

    let insightData
    try {
      insightData = JSON.parse(rawResponse)
    } catch {
      insightData = {
        health_score: 70,
        summary: 'Unable to fully analyze your finances. Please add more transaction data.',
        warnings: [],
        suggestions: [],
      }
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: insight, error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        household_id: member.household_id,
        type: 'judgement',
        data: insightData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: insight })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('profile_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const { data: insight, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('household_id', member.household_id)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: insight || null })
}
