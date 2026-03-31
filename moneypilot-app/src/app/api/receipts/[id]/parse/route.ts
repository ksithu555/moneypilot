import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const serviceSupabase = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: receipt, error: fetchError } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  await supabase
    .from('receipts')
    .update({ parse_status: 'processing' })
    .eq('id', params.id)

  try {
    const { data: fileData } = await serviceSupabase.storage
      .from('receipts')
      .download(receipt.storage_path)

    if (!fileData) {
      throw new Error('Failed to download receipt image')
    }

    const buffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = receipt.storage_path.endsWith('.png') ? 'image/png' : 'image/jpeg'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this receipt image and return it as JSON:
{
  "store_name": "string",
  "date": "YYYY-MM-DD",
  "total": number,
  "items": [
    { "name": "string", "quantity": number, "price": number }
  ],
  "payment_method": "string or null",
  "tax": number or null,
  "subtotal": number or null
}

If you cannot determine a value, use null. Return ONLY the JSON, no other text.`,
            },
          ],
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    const rawOcr = textContent ? (textContent as { type: 'text'; text: string }).text : ''
    
    let parsedData = null
    try {
      parsedData = JSON.parse(rawOcr)
    } catch {
      parsedData = { raw_text: rawOcr }
    }

    const { data: updatedReceipt, error: updateError } = await supabase
      .from('receipts')
      .update({
        raw_ocr: { response: rawOcr },
        parsed_data: parsedData,
        parse_status: 'completed',
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ data: updatedReceipt })
  } catch (error: any) {
    await supabase
      .from('receipts')
      .update({ parse_status: 'failed' })
      .eq('id', params.id)

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
